import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../store/authSlice";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#0a0e17",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "320px",
          padding: "32px",
          background: "#0f1523",
          border: "1px solid #1e2d45",
          borderRadius: "16px",
        }}
      >
        <h2
          style={{
            marginBottom: "24px",
            color: "#e8f4ff",
            textAlign: "center",
          }}
        >
          Telemetry Login
        </h2>
        {error && (
          <p
            style={{ color: "#ff4757", fontSize: "12px", textAlign: "center" }}
          >
            {error}
          </p>
        )}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "12px",
              color: "#6b84a8",
            }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "#151d2e",
              border: "1px solid #1e2d45",
              borderRadius: "6px",
              color: "#e8f4ff",
            }}
          />
        </div>
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "12px",
              color: "#6b84a8",
            }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "#151d2e",
              border: "1px solid #1e2d45",
              borderRadius: "6px",
              color: "#e8f4ff",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            background: "#00ff9d",
            border: "none",
            borderRadius: "6px",
            color: "#0a0e17",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {loading ? "Authenticating..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
