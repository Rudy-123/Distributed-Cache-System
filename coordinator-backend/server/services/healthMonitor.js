//every 5 seconds, ping all the cache nodes and check whether they r alive or not
const axios = require("axios");
const NodeConfig = require("../models/NodeConfig"); //for all the nodes
const hashRing = require("./hashRing");
const socketManager = require("./sockerManager");
const failoverManager = require("./failoverManager");

const checkNodesHealth = async (io) => {
  //io is the socket instance
  try {
    const nodes = await NodeConfig.find({});
    for (const node of nodes) {
      const start = Date.now(); //for latency check
      try {
        const url = `http://${node.host}:${node.port}/health`;
        const res = await axios.get(url, {
          timeout: 1500, //wait for the response for 1.5 seconds
        });
        node.status = "healthy";
        node.uptime = res.data.uptime;
        node.keysCount = res.data.keys || 0;
        node.lastHeartbeat = new Date();
        await node.save();
      } catch (err) {
        node.status = "dead";
        await node.save();
        if (node.role === "master") {
          await failoverManager.handleMasterFailure(node, io);
        }
      }
    }
    const updatedNodes = await NodeConfig.find({}); //fetch the details of nodes alive or dead
    socketManager.emitNodeStatus(updatedNodes);
  } catch (err) {
    console.error("Health Check Loop Error: ", err.message);
  }
};
const startHealthMonitor = (io) => {
  NodeConfig.find({}).then((nodes) => {
    //sync the hashring
    nodes.forEach((n) => {
      if (n.status === "healthy") {
        hashRing.addNode(n);
      }
    });
  });
  setInterval(() => checkNodesHealth, 5000);
};
module.exports = { startHealthMonitor };
