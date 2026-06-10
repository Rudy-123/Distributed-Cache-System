const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cacheRoutes = require("./routes/cache");
const authRoutes = require("./routes/auth");
const clusterRoutes = require("./routes/cluster");
const { startHealthMonitor } = require("./services/healthMonitor");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
app.use(cors());
app.use(express.json());

//Routes
app.use("/api/cache", cacheRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cluster", clusterRoutes);

//socket setup
const start = async () => {
  try {
    await connectDB();
    
    // Auto-seed default cluster cache nodes if database list is empty
    const NodeConfig = require("./models/NodeConfig");
    const count = await NodeConfig.countDocuments({});
    if (count === 0) {
      console.log("Database has no cache node configurations. Seeding node-1, node-2, and node-3...");
      await NodeConfig.create([
        { nodeId: "node-1", host: "127.0.0.1", port: 5051, role: "master", status: "dead" },
        { nodeId: "node-2", host: "127.0.0.1", port: 5052, role: "replica", status: "dead" },
        { nodeId: "node-3", host: "127.0.0.1", port: 5053, role: "replica", status: "dead" },
      ]);
    }

    require("./services/socketManager")(io);
    startHealthMonitor(io);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Node Coordinator running on the port ${PORT}`);
    });
  } catch (err) {
    console.error("Fatal Coordinator Startup Error:", err.message);
    process.exit(1);
  }
};
start();
