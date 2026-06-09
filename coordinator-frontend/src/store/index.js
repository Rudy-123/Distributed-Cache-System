import { configureStore } from "@reduxjs/toolkit";
import clusterReducer from "./clusterSlice";
import authReducer from "./authSlice";

export const store = configureStore({
  reducer: {
    cluster: clusterReducer,
    auth: authReducer,
  },
});
