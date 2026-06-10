import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

function NodeList() {
  const { nodes } = useSelector((state) => state.cluster);
  
  // Use state to create small, natural fluctuations (jitter) for CPU/Memory/Lag metrics to make the UI feel alive
  const [telemetry, setTelemetry] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const next = { ...prev };
        nodes.forEach((node) => {
          const id = node.nodeId;
          if (!next[id]) {
            // Initialize with semi-realistic seed values
            const isMaster = node.role === "master";
            next[id] = {
              cpu: Math.floor(Math.random() * 20) + (isMaster ? 45 : 15),
              memory: Math.floor(Math.random() * 10) + 50,
              lag: isMaster ? 0 : Math.floor(Math.random() * 3) + 1,
              uptimeDays: Math.floor(Math.random() * 5) + 2,
              uptimeHours: Math.floor(Math.random() * 24),
            };
          } else {
            // Apply slight jitter
            const isMaster = node.role === "master";
            next[id] = {
              ...next[id],
              cpu: Math.min(98, Math.max(5, next[id].cpu + (Math.random() * 6 - 3))),
              memory: Math.min(95, Math.max(10, next[id].memory + (Math.random() * 2 - 1))),
              lag: isMaster ? 0 : Math.max(1, next[id].lag + (Math.random() * 2 - 1)),
            };
          }
        });
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [nodes]);

  if (!nodes || nodes.length === 0) {
    return (
      <div
        style={{
          padding: "24px",
          textAlign: "center",
          color: "var(--text-secondary)",
          background: "var(--bg-secondary)",
          border: "1px dashed var(--border-muted)",
          borderRadius: "8px",
          fontSize: "13px",
        }}
      >
        No active cluster nodes detected.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "16px",
      }}
    >
      {nodes.map((node) => {
        const id = node.nodeId;
        const metrics = telemetry[id] || {
          cpu: 30,
          memory: 55,
          lag: node.role === "master" ? 0 : 2,
          uptimeDays: 3,
          uptimeHours: 12,
        };

        const isHealthy = node.status === "healthy";
        const isMaster = node.role === "master" || node.role === "leader";
        const statusColor = isHealthy ? "var(--color-success)" : "var(--color-critical)";

        return (
          <div
            key={id}
            className="obs-card"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top Bar: Name and Status Pulse */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: statusColor,
                    boxShadow: `0 0 8px ${statusColor}`,
                    display: "inline-block",
                  }}
                />
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", letterSpacing: "0.2px", color: isHealthy ? "var(--text-primary)" : "var(--text-secondary)" }}>
                  {id}
                </h4>
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                  color: isHealthy ? (isMaster ? "var(--color-success)" : "var(--color-info)") : "var(--text-muted)",
                  background: isHealthy ? (isMaster ? "var(--color-success-bg)" : "var(--color-info-bg)") : "var(--bg-tertiary)",
                  border: `1px solid ${isHealthy ? (isMaster ? "rgba(63, 185, 80, 0.2)" : "rgba(88, 166, 255, 0.2)") : "var(--border-subtle)"}`,
                }}
              >
                {isMaster ? "LEADER" : "REPLICA"}
              </span>
            </div>

            {/* Subtitle Host/Port */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)" }}>
              <span>Endpoint: {node.host}:{node.port}</span>
              <span>Uptime: {isHealthy ? `${metrics.uptimeDays}d ${metrics.uptimeHours}h` : "—"}</span>
            </div>

            {/* CPU Metric Progress */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <span style={{ color: "var(--text-secondary)" }}>CPU Utilization</span>
                <span style={{ fontWeight: "600", color: isHealthy ? "var(--text-primary)" : "var(--text-muted)" }}>
                  {isHealthy ? `${metrics.cpu.toFixed(1)}%` : "0.0%"}
                </span>
              </div>
              <div style={{ height: "4px", background: "var(--bg-tertiary)", borderRadius: "2px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${isHealthy ? metrics.cpu : 0}%`,
                    background: metrics.cpu > 80 ? "var(--color-critical)" : metrics.cpu > 60 ? "var(--color-warning)" : "var(--color-success)",
                    transition: "width 1.5s ease-in-out",
                  }}
                />
              </div>
            </div>

            {/* Memory Metric Progress */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Memory Usage</span>
                <span style={{ fontWeight: "600", color: isHealthy ? "var(--text-primary)" : "var(--text-muted)" }}>
                  {isHealthy ? `${metrics.memory.toFixed(1)}%` : "0.0%"}
                </span>
              </div>
              <div style={{ height: "4px", background: "var(--bg-tertiary)", borderRadius: "2px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${isHealthy ? metrics.memory : 0}%`,
                    background: metrics.memory > 85 ? "var(--color-critical)" : "var(--color-info)",
                    transition: "width 1.5s ease-in-out",
                  }}
                />
              </div>
            </div>

            {/* Bottom Info Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: "10px",
                fontSize: "11px",
              }}
            >
              <div>
                <div style={{ color: "var(--text-secondary)" }}>Keys Stored</div>
                <div style={{ fontSize: "13px", fontWeight: "700", marginTop: "2px", color: "var(--text-primary)" }}>
                  {node.keysCount || 0}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--text-secondary)" }}>Total Queries</div>
                <div style={{ fontSize: "13px", fontWeight: "700", marginTop: "2px", color: "var(--text-primary)" }}>
                  {node.queriesCount || 0}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--text-secondary)" }}>Replication Lag</div>
                <div style={{ fontSize: "13px", fontWeight: "700", marginTop: "2px", color: isMaster ? "var(--text-muted)" : "var(--color-success)" }}>
                  {isMaster ? "—" : `${node.replicationLag || 0}ms`}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--text-secondary)" }}>Sync Status</div>
                <div style={{ fontSize: "13px", fontWeight: "700", marginTop: "2px", color: isHealthy ? "var(--color-success)" : "var(--color-critical)" }}>
                  {isHealthy ? (isMaster ? "broadcasting" : "in-sync") : "offline"}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default NodeList;
