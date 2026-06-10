import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

function HitRatioGauge({ hitRatio = 0.92 }) {
  const data = [
    { name: "Hits", value: hitRatio },
    { name: "Misses", value: 1 - hitRatio },
  ];

  const COLORS = ["var(--color-success)", "var(--border-muted)"];

  return (
    <div
      className="obs-card"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", textAlign: "left", marginBottom: "8px" }}>
        <span className="obs-header" style={{ margin: 0 }}>
          Cache Hit Efficiency
        </span>
      </div>

      <div style={{ width: "100%", height: 130, position: "relative", marginTop: "12px" }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="90%"
              startAngle={180}
              endAngle={0}
              innerRadius={50}
              outerRadius={70}
              paddingAngle={0}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: "26px",
              fontWeight: "800",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {(hitRatio * 100).toFixed(1)}%
          </span>
          <p
            style={{
              margin: "2px 0 0 0",
              fontSize: "10px",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Hit Ratio
          </p>
        </div>
      </div>
    </div>
  );
}

export default HitRatioGauge;
