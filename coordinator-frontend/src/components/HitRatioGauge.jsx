import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

function HitRatioGauge({ hitRatio = 0.85 }) {
  const data = [
    { name: "Hits", value: hitRatio },
    { name: "Misses", value: 1 - hitRatio },
  ];

  const COLORS = ["#00ff9d", "#ff4757"];

  return (
    <div
      style={{
        padding: "24px",
        background: "#0f1523",
        border: "1px solid #1e2d45",
        borderRadius: "12px",
        textAlign: "center",
      }}
    >
      <h3 style={{ marginBottom: "8px", color: "#e8f4ff" }}>Cache Hit Ratio</h3>
      <div style={{ width: "100%", height: 180, position: "relative" }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
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
            bottom: "10px",
            left: 0,
            right: 0,
            fontSize: "24px",
            fontWeight: "bold",
            color: "#e8f4ff",
          }}
        >
          {(hitRatio * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

export default HitRatioGauge;
