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
require("./services/socketManager")(io);
startHealthMonitor(io);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Node Coordinator running on the port ${PORT}`);
});
