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

// Custom tooltip to show exact latency up to 6 decimal places on hover
const PrecisionTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0].payload;
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-muted)",
        borderRadius: "8px",
        padding: "10px 14px",
        fontFamily: "var(--font-mono)",
        minWidth: "170px",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: "700",
          color: "var(--text-primary)",
          marginBottom: "6px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: entry.color,
            display: "inline-block",
          }}
        />
        {entry.name}
      </div>
      <div
        style={{
          fontSize: "10px",
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: "2px",
        }}
      >
        {entry.isMaster ? "Leader Node (No Replication)" : "Replication Latency"}
      </div>
      <div
        style={{
          fontSize: "18px",
          fontWeight: "800",
          color: entry.isMaster ? "var(--text-muted)" : "var(--color-info)",
        }}
      >
        {entry.isMaster ? "0 ms" : `${entry.rawLatency.toFixed(6)} ms`}
      </div>
      <div
        style={{
          fontSize: "10px",
          color: "var(--text-secondary)",
          marginTop: "4px",
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "4px",
        }}
      >
        Role: <span style={{ color: entry.isMaster ? "var(--color-success)" : "var(--color-info)", fontWeight: "600" }}>{entry.isMaster ? "LEADER" : "REPLICA"}</span>
      </div>
    </div>
  );
};

function LatencyChart() {
  const { nodes } = useSelector((state) => state.cluster);

  // Unique colors for each node bar
  const COLORS = ["#58a6ff", "#3fb950", "#ffb300", "#ff3860", "#a55eea", "#26de81"];

  // Map nodes to simple latency data — use exact replicationLag from backend
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
    <div className="obs-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div>
          <span className="obs-header" style={{ margin: 0 }}>
            Replication Latency
          </span>
          <p
            style={{
              margin: "2px 0 0 0",
              fontSize: "11px",
              color: "var(--text-secondary)",
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
            }}
          >
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
                stroke="var(--border-subtle)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="var(--text-secondary)"
                fontSize="11"
                tickLine={false}
                axisLine={{ stroke: "var(--border-subtle)" }}
              />
              <YAxis
                stroke="var(--text-secondary)"
                fontSize="10"
                unit=" ms"
                tickLine={false}
                axisLine={{ stroke: "var(--border-subtle)" }}
              />
              <Tooltip
                content={<PrecisionTooltip />}
                cursor={{ fill: "rgba(255,255,255,0.02)" }}
              />
              <Bar
                dataKey="latency"
                name="Latency"
                radius={[4, 4, 0, 0]}
                barSize={44}
              >
                <LabelList
                  dataKey="latency"
                  position="top"
                  formatter={(val) => `${parseFloat(val).toFixed(2)} ms`}
                  style={{
                    fill: "var(--text-secondary)",
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    fontWeight: "600",
                  }}
                />
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isMaster ? "rgba(255,255,255,0.08)" : entry.color}
                    stroke={entry.isMaster ? "var(--border-subtle)" : "none"}
                    strokeDasharray={entry.isMaster ? "4 2" : "none"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default LatencyChart;
