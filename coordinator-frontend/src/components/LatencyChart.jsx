import React from "react";
import { useSelector } from "react-redux";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function LatencyChart() {
  const { history } = useSelector((state) => state.cluster);

  return (
    <div
      className="latency-chart-card"
      style={{
        padding: "24px",
        background: "#0f1523",
        border: "1px solid #1e2d45",
        borderRadius: "12px",
      }}
    >
      <h3 style={{ marginBottom: "16px", color: "#e8f4ff" }}>
        Response Latency
      </h3>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <AreaChart data={history.latency}>
            <defs>
              <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4da6ff" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#4da6ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
            <XAxis dataKey="timestamp" stroke="#6b84a8" />
            <YAxis stroke="#6b84a8" />
            <Tooltip
              contentStyle={{
                background: "#0f1523",
                border: "1px solid #1e2d45",
                color: "#c8d8f0",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              name="Latency (ms)"
              stroke="#4da6ff"
              fillOpacity={1}
              fill="url(#colorLat)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default LatencyChart;
