//bridge between frontend and backend
import { io } from "socket.io-client";
import { setNodes, updateNode, pushMetrics } from "../store/clusterSlice";
let socket = null;
//function that establishes socket connection
export const initsocket = (token, dispatch) => {
  //token=jwt and dispatch-redux function
  socket = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:5000", {
    auth: { token }, //token send through socket connection
  }); //connection url for the backend
};

socket.on("connect", () => {
  console.log("Connected to Coordinator Websocket");
});

socket.on("node-status-change", (nodes) => {
  dispatch(setNodes(nodes));
});

socket.on("node-update", (node) => {
  dispatch(updateNode(node));
});

socket.on("metrics-update", (metrics) => {
  // metrics={qps,latency,timestamp}
  dispatch(
    pushMetrics({
      timestamp: new Date(metrics.timestamp).toLocaleTimeString(),
      qps: metrics.qps,
      latency: metrics.latency,
    }),
  );
});
socket.on("failover-triggered", (event) => {
  alert(
    `[FAILOVER TRIGGERED] Node ${event.deadMasterId} died. Promoted ${event.newMasterId} to Master.`,
  );
});

return socket;
export const getSocket = () => socket;
