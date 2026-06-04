//store log in DB
const mongoose = require("mongoose");
const AccessLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, //in the user collection
    ref: "User", //User model
    required: false,
  },
  action: {
    type: String,
    required: true,
  },
  key: {
    type: String,
    required: true,
  },
  nodeId: { type: String, required: true },
  responseTimeMs: { type: Number, required: true }, //for performanmce monitoring
  statusCode: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});
module.exports = mongoose.model("AccessLog", AccessLogSchema);
