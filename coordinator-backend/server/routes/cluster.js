const express = require("express");
const router = express.Router();
const NodeConfig = require("../models/NodeConfig");
const hashRing = require("../services/hashRing");
const { protect } = require("../middleware/auth");

//cluster status
router.get("/status", protect, async (req, res) => {
  //protect means login is reqd
  try {
    const nodes = await NodeConfig.find({}); //find all of them
    res.json(nodes); //returns all the nodes
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//add node
router.post("/nodes", protech, async (req, res) => {
  const { nodeId, host, port, role } = req.body;
  try {
    const node = await NodeConfig.create({ nodeId, host, port, role });
    hashRing.addNode(node); //add the node to the ring
    res.status(201).json(node);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//remove node
router.post("/nodes/:nodeId", protect, async (req, res) => {
  try {
    await NodeConfig.findOneAndDelete({ nodeId: req.params.nodeId });
    hashRing.removeNode(req.params.nodeId); //delete on the basis of nodeid
    res.json({ message: "Node removed Successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
