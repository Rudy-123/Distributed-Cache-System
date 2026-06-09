import React from "react";
import { useSelector } from "react-redux";

function NodeList() {
  const { nodes } = useSelector((state) => state.cluster);

  return (
    <div
      className="node-list-panel"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "16px",
        marginTop: "24px",
      }}
    >
      {nodes.map((node) => (
        <div
          key={node.nodeId}
          className="node-card"
          style={{
            padding: "20px",
            background: "#0f1523",
            border: "1px solid #1e2d45",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h4 style={{ color: "#e8f4ff", margin: 0 }}>{node.nodeId}</h4>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: node.status === "healthy" ? "#00ff9d" : "#ff4757",
                boxShadow:
                  node.status === "healthy"
                    ? "0 0 10px #00ff9d"
                    : "0 0 10px #ff4757",
              }}
            ></span>
          </div>
          <p style={{ fontSize: "12px", color: "#6b84a8", margin: 0 }}>
            Endpoint: {node.host}:{node.port}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "8px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "#00ff9d",
                background: "rgba(0,255,157,0.05)",
                padding: "2px 6px",
                borderRadius: "4px",
                textTransform: "uppercase",
              }}
            >
              {node.role}
            </span>
            <span style={{ fontSize: "12px", color: "#c8d8f0" }}>
              {node.keysCount} keys
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default NodeList;
