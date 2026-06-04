const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: { Type: String, required: true, unique: true },
    password: { Type: String, required: true },
    role: { Type: String, enum: ["admin", "viewer"], defailt: "viewer" },
  },
  { timestamps: true },
);
module.exports = mongoose.model("User", userSchema);
