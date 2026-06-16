import React from "react";
import { useSelector } from "react-redux";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  LabelList,
} from "recharts";

// Custom tooltip with glassmorphism styling
const PrecisionTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0].payload;
  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(13, 17, 26, 0.95), rgba(22, 27, 34, 0.9))",
        border: "1px solid var(--border-muted)",
        borderRadius: "10px",
        padding: "12px 16px",
        fontFamily: "var(--font-mono)",
        minWidth: "180px",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: "700",
          color: "var(--text-primary)",
          marginBottom: "8px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: entry.color,
            display: "inline-block",
            boxShadow: `0 0 6px ${entry.color}`,
          }}
        />
        {entry.name}
      </div>
      <div
        style={{
          fontSize: "9px",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          marginBottom: "4px",
          fontWeight: "600",
        }}
      >
        {entry.isMaster ? "Leader Node (No Replication)" : "Replication Latency"}
      </div>
      <div
        style={{
          fontSize: "20px",
          fontWeight: "800",
          color: entry.isMaster ? "var(--text-muted)" : "var(--color-info)",
          letterSpacing: "-0.5px",
        }}
      >
        {entry.isMaster ? "0 ms" : `${entry.rawLatency.toFixed(4)} ms`}
      </div>
      <div
        style={{
          fontSize: "10px",
          color: "var(--text-secondary)",
          marginTop: "6px",
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "6px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Role</span>
        <span style={{ color: entry.isMaster ? "var(--color-success)" : "var(--color-info)", fontWeight: "700" }}>
          {entry.isMaster ? "LEADER" : "REPLICA"}
        </span>
      </div>
    </div>
  );
};

function LatencyChart() {
  const { nodes } = useSelector((state) => state.cluster);

  // Unique colors for each node bar
  const COLORS = ["#58a6ff", "#3fb950", "#f59e0b", "#f85149", "#a855f7", "#06b6d4"];

  // Map nodes to simple latency data
  const data = nodes.map((node, idx) => {
    const isMaster = node.role === "master" || node.role === "leader";
    const rawLatency = isMaster ? 0 : (node.replicationLag || 0);
    return {
      name: node.nodeId,
      latency: rawLatency,
      rawLatency: rawLatency,
      isMaster: isMaster,
      role: node.role,
      color: COLORS[idx % COLORS.length],
    };
  });

  return (
    <div
      className="obs-card"
      style={{
        background: "linear-gradient(135deg, rgba(13, 17, 26, 0.9), rgba(22, 27, 34, 0.7))",
        padding: "20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "16px", opacity: 0.6 }}>◉</span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              Replication Latency
            </span>
          </div>
          <p
            style={{
              margin: "0",
              fontSize: "11px",
              color: "var(--text-muted)",
            }}
          >
            Time taken to replicate data from the master node to each replica (ms)
          </p>
        </div>
      </div>

      <div style={{ width: "100%", height: 220 }}>
        {data.length === 0 ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
              fontSize: "13px",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "20px", opacity: 0.4 }}>◈</span>
            Awaiting node data...
          </div>
        ) : (
          <ResponsiveContainer>
            <BarChart
              data={data}
              margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="var(--text-muted)"
                fontSize="10"
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                fontFamily="var(--font-mono)"
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize="10"
                unit=" ms"
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                fontFamily="var(--font-mono)"
              />
              <Tooltip
                content={<PrecisionTooltip />}
                cursor={{ fill: "rgba(255,255,255,0.015)" }}
              />
              <Bar
                dataKey="latency"
                name="Latency"
                radius={[6, 6, 0, 0]}
                barSize={40}
              >
                <LabelList
                  dataKey="latency"
                  position="top"
                  formatter={(val) => `${parseFloat(val).toFixed(2)} ms`}
                  style={{
                    fill: "var(--text-muted)",
                    fontSize: "9px",
                    fontFamily: "var(--font-mono)",
                    fontWeight: "700",
                  }}
                />
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isMaster ? "rgba(255,255,255,0.05)" : entry.color}
                    stroke={entry.isMaster ? "var(--border-subtle)" : "none"}
                    strokeDasharray={entry.isMaster ? "4 2" : "none"}
                    style={{ filter: !entry.isMaster ? `drop-shadow(0 0 4px ${entry.color}40)` : "none" }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      {data.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            marginTop: "14px",
            paddingTop: "12px",
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {data.map((entry) => (
            <div
              key={entry.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "10px",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: entry.isMaster ? "1px" : "50%",
                  backgroundColor: entry.isMaster ? "var(--border-muted)" : entry.color,
                  display: "inline-block",
                  boxShadow: entry.isMaster ? "none" : `0 0 4px ${entry.color}`,
                }}
              />
              {entry.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LatencyChart;
