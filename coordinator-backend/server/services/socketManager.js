//backend(node js)->(socket.io)->Frontend
let activeIO = null;
module.exports = (io) => {
  activeIO = io;
  io.on("connection", (socket) => {
    //establish connection
    console.log(`Dashboard client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Dashboard client disconnected: ${socket.id}`);
    });
  });
};

module.exports.emitNodeStatus = (nodes) => {
  if (activeIO) {
    activeIO.emit("node-status-change", nodes);
  }
};

module.exports.emitMetrics = (metrics) => {
  if (activeIO) {
    activeIO.emit("metrics-update", metrics);
  }
};

module.exports.emitFailover = (event) => {
  if (activeIo) {
    activeIo.emit("failover-triggered", event);
  }
};
