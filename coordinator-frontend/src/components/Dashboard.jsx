import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";
import LatencyChart from "./LatencyChart";
import CacheExplorer from "./CacheExplorer";
import NodeList from "./NodeList";
import ClusterTopology from "./ClusterTopology";
import { getSocket } from "../services/socket";

const dashStyles = `
  @keyframes gradientLine {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes livePulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.6); opacity: 0.4; }
  }
  .metric-card {
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  .metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
  }
  .metric-card::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.02), transparent);
    transition: left 0.6s ease;
  }
  .metric-card:hover::after {
    left: 100%;
  }
  .logout-btn:hover {
    background: rgba(248, 81, 73, 0.15) !important;
    border-color: var(--color-critical) !important;
    color: var(--color-critical) !important;
  }
`;

function Dashboard() {
  const dispatch = useDispatch();
  const { email } = useSelector((state) => state.auth.user || { email: "admin@cluster.local" });
  const { nodes, history } = useSelector((state) => state.cluster);

  const [logs, setLogs] = useState([]);

  // Listen to real socket events
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      const handleFailover = (event) => {
        console.log(`[FAILOVER] Leader node ${event.deadMasterId} died. Promoted replica ${event.newMasterId}.`);
      };
      
      const handleNodeStatus = (updatedNodes) => {
        console.log(`Cluster size updated: ${updatedNodes.length} nodes registered.`);
      };

      socket.on("failover-triggered", handleFailover);
      socket.on("node-status-change", handleNodeStatus);

      return () => {
        socket.off("failover-triggered", handleFailover);
        socket.off("node-status-change", handleNodeStatus);
      };
    }
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  // Derive dynamic metrics for the 4-card header row
  const activeNodesCount = nodes.filter((n) => n.status === "healthy").length;
  const totalNodesCount = nodes.length;
  const isHealthy = activeNodesCount > 0 && activeNodesCount === totalNodesCount;
  
  const leaderNode = nodes.find((n) => n.role === "master" || n.role === "leader");
  const leaderName = leaderNode ? leaderNode.nodeId : "None";
  
  const totalKeys = nodes.reduce((sum, n) => sum + (n.keysCount || 0), 0);

  const metricCards = [
    {
      label: "Cluster Status",
      val: isHealthy ? "ONLINE" : "DEGRADED",
      color: isHealthy ? "var(--color-success)" : "var(--color-critical)",
      accent: isHealthy ? "linear-gradient(180deg, #3fb950, #2ea043)" : "linear-gradient(180deg, #f85149, #da3633)",
      icon: "◉",
      sub: isHealthy ? "All systems nominal" : "Action required",
    },
    {
      label: "Active Nodes",
      val: `${activeNodesCount}/${totalNodesCount}`,
      color: "var(--color-info)",
      accent: "linear-gradient(180deg, #58a6ff, #388bfd)",
      icon: "⬡",
      sub: `${activeNodesCount} responding`,
    },
    {
      label: "Leader Node",
      val: leaderName,
      color: "var(--color-purple)",
      accent: "linear-gradient(180deg, #a855f7, #7c3aed)",
      icon: "★",
      sub: "Consensus elected",
    },
    {
      label: "Total Keys",
      val: totalKeys.toLocaleString(),
      color: "var(--color-amber)",
      accent: "linear-gradient(180deg, #f59e0b, #d97706)",
      icon: "◈",
      sub: "Across all nodes",
    },
  ];

  return (
    <>
      <style>{dashStyles}</style>
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-sans)",
          padding: "28px 32px",
          boxSizing: "border-box",
        }}
      >
        {/* ── Header ── */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "20px",
            marginBottom: "8px",
            position: "relative",
          }}
        >
          <div>
            {/* Breadcrumb */}
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px", fontFamily: "var(--font-mono)", letterSpacing: "0.5px" }}>
              cluster / monitoring / <span style={{ color: "var(--text-secondary)" }}>dashboard</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: "900",
                  margin: 0,
                  background: "linear-gradient(135deg, #3fb950, #58a6ff, #a855f7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.5px",
                }}
              >
                Cache Cluster Dashboard
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    background: isHealthy ? "var(--color-success-bg)" : "var(--color-critical-bg)",
                    color: isHealthy ? "var(--color-success)" : "var(--color-critical)",
                    border: `1px solid ${isHealthy ? "rgba(63, 185, 80, 0.2)" : "rgba(248, 81, 73, 0.2)"}`,
                    padding: "4px 12px",
                    borderRadius: "16px",
                    fontSize: "10px",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: isHealthy ? "var(--color-success)" : "var(--color-critical)",
                      animation: "livePulse 2s ease-in-out infinite",
                      display: "inline-block",
                    }}
                  />
                  {isHealthy ? "Live" : "Degraded"}
                </span>
              </div>
            </div>
            <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Real-time observability console for distributed consensus cache infrastructure
            </p>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              {email}
            </span>
            <button
              className="logout-btn"
              onClick={handleLogout}
              style={{
                padding: "8px 16px",
                background: "transparent",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.5px",
              }}
            >
              LOG OUT
            </button>
          </div>
        </header>

        {/* Gradient divider line */}
        <div
          style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(63,185,80,0.3), rgba(88,166,255,0.3), rgba(168,85,247,0.2), transparent)",
            backgroundSize: "200% 100%",
            animation: "gradientLine 4s ease infinite",
            marginBottom: "24px",
          }}
        />

        {/* ── 4-Card Metrics Row ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {metricCards.map((item, idx) => (
            <div
              key={idx}
              className="metric-card obs-card"
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "100px",
                borderLeft: "3px solid transparent",
                borderImage: `${item.accent} 1`,
                animation: `fadeIn 0.4s ease-out ${idx * 0.08}s backwards`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "700" }}>
                  {item.label}
                </span>
                <span style={{ fontSize: "18px", opacity: 0.3, lineHeight: 1 }}>{item.icon}</span>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: "850",
                    color: item.color,
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "-0.5px",
                    display: "block",
                    marginTop: "8px",
                  }}
                >
                  {item.val}
                </span>
                <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "500", marginTop: "4px", display: "block" }}>
                  {item.sub}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Layout Grid ── */}
        <main
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
          }}
        >
          {/* Left Column */}
          <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ animation: "fadeIn 0.5s ease-out 0.3s backwards" }}>
              <ClusterTopology />
            </div>

            <div className="obs-card" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px", animation: "fadeIn 0.5s ease-out 0.4s backwards" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
                  Cluster Node Inspector
                </h2>
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>
                  Live telemetry, resource utilization, and sync status for all cache processes
                </p>
              </div>
              <NodeList />
            </div>
          </section>

          {/* Right Column */}
          <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ animation: "fadeIn 0.5s ease-out 0.3s backwards" }}>
              <CacheExplorer />
            </div>
            <div style={{ animation: "fadeIn 0.5s ease-out 0.4s backwards" }}>
              <LatencyChart />
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export default Dashboard;
