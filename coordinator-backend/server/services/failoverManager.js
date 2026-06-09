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
    hashRing.removeNode(deadMaster, io);
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
      candidate.role = "master";
      await candidate.save();
      console.log(`[FAILOVER] Promoted replica ${candidate.nodeId} to MASTER.`);
      socketManager.emitFailover({
        event: "promoted",
        deadMasterId: deadMaster.nodeId,
        newMasterId: candodate.nodeId,
      });
      hashring.addNode(candidate);
    } catch (err) {
      console.error(
        `[FAILOVER] Failed promoting node ${candidate.nodeId}:`,
        err.message,
      );
    }
  }
}
module.exports = new failoverManager();
