import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";
import LatencyChart from "./LatencyChart";
import CacheExplorer from "./CacheExplorer";
import NodeList from "./NodeList";
import ClusterTopology from "./ClusterTopology";
import { getSocket } from "../services/socket";

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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-sans)",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      {/* Header bar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "20px",
          marginBottom: "24px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: "800",
                margin: 0,
                background: "linear-gradient(90deg, #3fb950, #58a6ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Distributed Cache Explorer
            </h1>
            <span
              style={{
                background: isHealthy ? "var(--color-success-bg)" : "var(--color-critical-bg)",
                color: isHealthy ? "var(--color-success)" : "var(--color-critical)",
                border: `1px solid ${isHealthy ? "rgba(63, 185, 80, 0.2)" : "rgba(248, 81, 73, 0.2)"}`,
                padding: "4px 12px",
                borderRadius: "16px",
                fontSize: "11px",
                fontWeight: "800",
                textTransform: "uppercase",
              }}
            >
              {isHealthy ? "Cluster Healthy" : "Degraded"}
            </span>
          </div>
          <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
            High-density real-time monitoring console for the distributed consensus cache cluster.
          </p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            Logged in as: <strong style={{ color: "var(--text-primary)" }}>{email}</strong>
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 16px",
              background: "var(--color-critical-bg)",
              border: "1px solid var(--color-critical)",
              color: "var(--color-critical)",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "var(--color-critical)";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "var(--color-critical-bg)";
              e.currentTarget.style.color = "var(--color-critical)";
            }}
          >
            LOG OUT
          </button>
        </div>
      </header>

      {/* 4-Card Overview Metrics Grid Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {[
          { label: "Cluster Status", val: isHealthy ? "ONLINE" : "DEGRADED", color: isHealthy ? "var(--color-success)" : "var(--color-critical)" },
          { label: "Active Nodes", val: `${activeNodesCount}/${totalNodesCount}` },
          { label: "Leader Node", val: leaderName, color: "var(--color-success)" },
          { label: "Total Keys", val: totalKeys.toLocaleString() },
        ].map((item, idx) => (
          <div
            key={idx}
            className="obs-card"
            style={{
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "80px",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "700" }}>
              {item.label}
            </span>
            <span
              style={{
                fontSize: "26px",
                fontWeight: "850",
                color: item.color || "var(--text-primary)",
                fontFamily: "var(--font-mono)",
                marginTop: "8px",
              }}
            >
              {item.val}
            </span>
          </div>
        ))}
      </div>

      {/* Main layout grid */}
      <main
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
        }}
      >
        {/* Left Column (Topology, Node Cards) */}
        <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr" }}>
            <ClusterTopology />
          </div>

          <div className="obs-card" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
            <div>
              <h2 className="obs-header" style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "var(--text-primary)" }}>Cluster Node Inspector</h2>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                Live CPU, Memory allocation and network sync stats for all cache processes.
              </p>
            </div>
            <NodeList />
          </div>

        </section>

        {/* Right Column (Terminal CLI, Latency Chart) */}
        <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <CacheExplorer />
          
          <LatencyChart />

        </section>
      </main>
    </div>
  );
}

export default Dashboard;
