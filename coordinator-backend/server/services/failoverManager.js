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

    // Find the candidate replica with the highest uptime inside the same shard
    const candidate = await NodeConfig.findOne({
      shardId: deadMaster.shardId,
      role: "replica",
      status: "healthy",
    }).sort({ replicationOffset: -1, uptime: -1 }); // Priority 1: Data offset, Priority 2: Uptime

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

      //Fetch all other healthy replica nodes within the same shard to register them as peers to the new master
      const otherReplicas = await NodeConfig.find({
        shardId: deadMaster.shardId,
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
