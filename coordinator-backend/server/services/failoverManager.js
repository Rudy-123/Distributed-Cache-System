//this is the main logic where it decides if the master gets failed then 1 replica autiomatically becomes master
const NodeConfig = require("../models/NodeConfig");
const hashRing = require("./hashRing");
const socketManager = require("./socketManager");
const axios = require("axios");

class failoverManager {
  async handleMasterFailure(deadMaster, io) {
    //this function is called when the health monitor detects that master.status=dead
    console.log(
      `[FAILOVER] Primary master ${deadMaster.nodeId} is dead. Starting failover...`,
    );
    hashRing.removeNode(deadMaster.nodeId);

    // Find the candidate replica with the highest uptime
    const candidate = await NodeConfig.findOne({
      role: "replica",
      status: "healthy",
    }).sort({ uptime: -1 }); //sort in the descending order so that we can pick the most stable replica and make it as the master

    if (!candidate) {
      console.error(
        "[FAILOVER] Critical: No healthy replicas available to promote.",
      );
      return;
    }

    try {
      //Notify the physical C++ cache node of its promotion and clear its replica peers
      console.log(
        `[FAILOVER] Promoting physical C++ node http://${candidate.host}:${candidate.port}/promote`,
      );
      await axios.post(
        `http://${candidate.host}:${candidate.port}/promote`,
        {},
        { timeout: 1500 },
      );

      //Fetch all other healthy replica nodes to register them as peers to the new master
      const otherReplicas = await NodeConfig.find({
        role: "replica",
        status: "healthy",
        nodeId: { $ne: candidate.nodeId },
      });

      for (const rep of otherReplicas) {
        try {
          console.log(
            `[FAILOVER] Registering peer ${rep.nodeId} (${rep.host}:${rep.port}) to new Master.`,
          );
          await axios.post(
            `http://${candidate.host}:${candidate.port}/peers`,
            {
              host: rep.host,
              port: rep.port,
            },
            { timeout: 1000 },
          );
        } catch (peerErr) {
          console.error(
            `[FAILOVER] Failed to register peer ${rep.nodeId} to new Master: ${peerErr.message}`,
          );
        }
      }

      // Update the candidate node's role in the DB to master
      candidate.role = "master";
      await candidate.save();

      console.log(
        `[FAILOVER] Promoted replica ${candidate.nodeId} to MASTER in DB.`,
      );

      //Update the Hash Ring and notify via WebSockets
      socketManager.emitFailover({
        event: "promoted",
        deadMasterId: deadMaster.nodeId,
        newMasterId: candidate.nodeId,
      });
      hashRing.addNode(candidate);
    } catch (err) {
      console.error(
        `[FAILOVER] Failed promoting node ${candidate.nodeId}:`,
        err.message,
      );
    }
  }
}
module.exports = new failoverManager();
