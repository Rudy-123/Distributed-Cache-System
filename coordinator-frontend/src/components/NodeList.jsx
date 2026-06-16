import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const nodeStyles = `
  .node-card {
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  .node-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.03) !important;
    border-color: var(--border-muted) !important;
  }
  .node-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  }
  .progress-bar-fill {
    position: relative;
    overflow: hidden;
  }
  .progress-bar-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    animation: barShimmer 2.5s ease-in-out infinite;
  }
  @keyframes barShimmer {
    0% { left: -100%; }
    100% { left: 200%; }
  }
  @keyframes statusBreathe {
    0%, 100% { transform: scale(1); box-shadow: 0 0 4px currentColor; }
    50% { transform: scale(1.3); box-shadow: 0 0 10px currentColor; }
  }
`;

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
          padding: "32px",
          textAlign: "center",
          color: "var(--text-secondary)",
          background: "rgba(13, 17, 26, 0.5)",
          border: "1px dashed var(--border-muted)",
          borderRadius: "10px",
          fontSize: "13px",
        }}
      >
        <span style={{ fontSize: "24px", display: "block", marginBottom: "8px", opacity: 0.5 }}>⬡</span>
        No active cluster nodes detected.
      </div>
    );
  }

  return (
    <>
      <style>{nodeStyles}</style>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "14px",
        }}
      >
        {nodes.map((node, nodeIdx) => {
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
              className="node-card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                position: "relative",
                overflow: "hidden",
                background: isHealthy
                  ? "linear-gradient(135deg, rgba(13, 17, 26, 0.9), rgba(22, 27, 34, 0.7))"
                  : "linear-gradient(135deg, rgba(30, 12, 12, 0.5), rgba(22, 17, 17, 0.6))",
                border: `1px solid ${isHealthy ? "var(--border-subtle)" : "rgba(248, 81, 73, 0.15)"}`,
                borderRadius: "10px",
                padding: "16px",
                backdropFilter: "blur(8px)",
                boxShadow: "0 2px 16px rgba(0, 0, 0, 0.2)",
                opacity: isHealthy ? 1 : 0.7,
                filter: isHealthy ? "none" : "saturate(0.6)",
                animation: `fadeIn 0.4s ease-out ${nodeIdx * 0.06}s backwards`,
              }}
            >
              {/* Top Bar: Name and Status */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: statusColor,
                      display: "inline-block",
                      color: statusColor,
                      animation: isHealthy ? "statusBreathe 2.5s ease-in-out infinite" : "none",
                    }}
                  />
                  <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "700", letterSpacing: "0.2px", color: isHealthy ? "var(--text-primary)" : "var(--text-secondary)" }}>
                    {id}
                  </h4>
                </div>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: "800",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    color: isHealthy ? (isMaster ? "#fbbf24" : "var(--color-info)") : "var(--text-muted)",
                    background: isHealthy ? (isMaster ? "rgba(251, 191, 36, 0.1)" : "var(--color-info-bg)") : "var(--bg-tertiary)",
                    border: `1px solid ${isHealthy ? (isMaster ? "rgba(251, 191, 36, 0.2)" : "rgba(88, 166, 255, 0.2)") : "var(--border-subtle)"}`,
                    boxShadow: isMaster && isHealthy ? "0 0 8px rgba(251, 191, 36, 0.1)" : "none",
                  }}
                >
                  {isMaster ? "★ LEADER" : "REPLICA"}
                </span>
              </div>

              {/* Subtitle */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
                <span style={{ fontFamily: "var(--font-mono)" }}>{node.host}:{node.port}</span>
                <span>{isHealthy ? `${metrics.uptimeDays}d ${metrics.uptimeHours}h` : "offline"}</span>
              </div>

              {/* CPU Progress */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                  <span style={{ color: "var(--text-secondary)", fontWeight: "500" }}>CPU</span>
                  <span style={{ fontWeight: "700", color: isHealthy ? "var(--text-primary)" : "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "10px" }}>
                    {isHealthy ? `${metrics.cpu.toFixed(1)}%` : "—"}
                  </span>
                </div>
                <div style={{ height: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "2px", overflow: "hidden" }}>
                  <div
                    className={isHealthy ? "progress-bar-fill" : ""}
                    style={{
                      height: "100%",
                      width: `${isHealthy ? metrics.cpu : 0}%`,
                      background: metrics.cpu > 80 ? "linear-gradient(90deg, #f85149, #ff6b6b)" : metrics.cpu > 60 ? "linear-gradient(90deg, #d29922, #f59e0b)" : "linear-gradient(90deg, #2ea043, #3fb950)",
                      transition: "width 1.5s ease-in-out",
                      borderRadius: "2px",
                    }}
                  />
                </div>
              </div>

              {/* Memory Progress */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                  <span style={{ color: "var(--text-secondary)", fontWeight: "500" }}>Memory</span>
                  <span style={{ fontWeight: "700", color: isHealthy ? "var(--text-primary)" : "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "10px" }}>
                    {isHealthy ? `${metrics.memory.toFixed(1)}%` : "—"}
                  </span>
                </div>
                <div style={{ height: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "2px", overflow: "hidden" }}>
                  <div
                    className={isHealthy ? "progress-bar-fill" : ""}
                    style={{
                      height: "100%",
                      width: `${isHealthy ? metrics.memory : 0}%`,
                      background: metrics.memory > 85 ? "linear-gradient(90deg, #f85149, #ff6b6b)" : "linear-gradient(90deg, #388bfd, #58a6ff)",
                      transition: "width 1.5s ease-in-out",
                      borderRadius: "2px",
                    }}
                  />
                </div>
              </div>

              {/* Bottom Stats Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1px",
                  borderTop: "1px solid rgba(255,255,255,0.04)",
                  paddingTop: "10px",
                  fontSize: "10px",
                }}
              >
                {[
                  { label: "Keys", value: node.keysCount || 0, color: "var(--text-primary)" },
                  { label: "Queries", value: node.queriesCount || 0, color: "var(--text-primary)" },
                  { label: "Repl. Lag", value: isMaster ? "—" : `${(node.replicationLag || 0).toFixed(1)}ms`, color: isMaster ? "var(--text-muted)" : "var(--color-info)" },
                  { label: "Sync", value: isHealthy ? (isMaster ? "broadcasting" : "in-sync") : "offline", color: isHealthy ? "var(--color-success)" : "var(--color-critical)" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "6px 4px",
                      borderRadius: "4px",
                      background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                    }}
                  >
                    <div style={{ color: "var(--text-muted)", fontSize: "9px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{stat.label}</div>
                    <div style={{ fontSize: "12px", fontWeight: "700", marginTop: "2px", color: stat.color, fontFamily: "var(--font-mono)" }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default NodeList;
