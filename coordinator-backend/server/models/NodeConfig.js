const mongoose = require("mongoose");

//it has the schema for the cluster nodes information
//schema for no of nodes,ip of node,port,role->master or replica

const NodeConfigSchema = new mongoose.Schema(
  {
    nodeId: { type: String, required: true, unique: true },
    host: { type: String, required: true },
    port: { type: Number, required: true },
    shardId: { type: String, default: "shard-1" }, // Grouping 1 master + N replicas
    role: { type: String, enum: ["master", "replica"], default: "replica" }, //enum means only 2 values are allowed
    status: {
      type: String,
      enum: ["healthy", "dead", "unknown"],
      default: "unknown",
    },
    lastHeartbeat: { type: Date, default: Date.now() },
    uptime: { type: Number, default: 0 },
    keysCount: { type: Number, default: 0 }, //how many cache entries in the node
    queriesCount: { type: Number, default: 0 }, // actual queries processed count
    replicationLag: { type: Number, default: 0 }, // actual network/replication latency in ms
    replicationOffset: { type: Number, default: 0 }, // C++ data offset
  },
  { timestamps: true },
);
module.exports = mongoose.model("NodeConfig", NodeConfigSchema);
