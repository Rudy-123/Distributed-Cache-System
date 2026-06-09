import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { initSocket } from "./services/socket";
import Dashboard from "./components/Dashboard";
import LoginPage from "./components/LoginPage";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector((state) => state.auth); //use for taking data from redux store
  useEffect(() => {
    if (isAuthenticated && token) {
      //connect to the websocket coordinator
      const socket = initSocket(token, dispatch); //formation of websocket connection
      return () => socket.disconnect();
    }
  }, [isAuthenticated, token, dispatch]);
  return (
    <Router>
      <div className="app-container dark-mode">
        <Routes>
          <Route
            path="/login"
            element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />}
          />
          <Route
            path="/"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </Router>
  );
}
export default App;
