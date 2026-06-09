//create redux store its the memory/db for the frontend
import { configureStore } from "@reduxjs/toolkit";
import clusterReducer from "./clusterSlice";
import authReducer from "./authSlice";

//initial state
const clusterSlice = createSlice({
  //initial all empty
  name: "cluster",
  initialState: {
    nodes: [],
    history: {
      qps: [], //queries per sec
      latency: [],
    },
  },
  //reducers are the only functions allowed to write in out global network
  reducers: {
    setNodes: (state, action) => {
      state.nodes = action.payload; //reset eveything
    },
    updateNode: (state, action) => {
      const idx = state.nodes.findIndex(
        (n) => n.nodeId === action.payload.nodeId,
      );
      if (idx != -1) {
        state.nodes[idx] = action.payload(); //if the idx is present then update existing
      } else {
        state.nodes.push(action.payload); //add new
      }
    },
    pushMetrics: (state, action) => {
      const { timestamp, qps, latency } = action.payload;
      state.history.qps.push({ timestamp, value: qps });
      state.history.latency.push({ timestamp, value: latency });

      // Limit history buffer to 30 points
      if (state.history.qps.length > 30) state.history.qps.shift();
      if (state.history.latency.length > 30) state.history.latency.shift();
    },
  },
});
export const { setNodes, updateNode, pushMetrics } = clusterSlice.actions;
export default clusterSlice.reducer;
