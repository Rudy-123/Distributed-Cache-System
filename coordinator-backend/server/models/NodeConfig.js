const mongoose = require("mongoose");

//it has the schema for the cluster nodes information
//schema for no of nodes,ip of node,port,role->master or replica

const NodeConfigSchema = new mongoose.Schema(
  {
    nodeId: { type: String, required: true, unique: true },
    host: { type: String, required: true },
    port: { type: Number, required: true },
    role: { type: String, enum: ["master", "replica"], default: "replica" }, //enum means only 2 values are allowed
    status: {
      type: String,
      enum: ["healthy", "dead", "unknwon"],
      default: "unknown",
    },
    lastHeartbeat: { type: Date, default: Date.now() },
    uptime: { type: Number, default: 0 },
    keysCount: { type: Number, default: 0 }, //how many cache entries in the node
  },
  { timestamps: true },
);
module.exports = mongoose.model("NodeConfig", NodeConfigSchema);
