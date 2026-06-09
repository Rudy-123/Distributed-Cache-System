import React from "react";
import { useSelector } from "react-redux";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function ClusterOverview() {
  const { history } = useSelector((state) => state.cluster);

  return (
    <div
      className="cluster-overview-card"
      style={{
        padding: "24px",
        background: "#0f1523",
        border: "1px solid #1e2d45",
        borderRadius: "12px",
      }}
    >
      <h3 style={{ marginBottom: "16px", color: "#e8f4ff" }}>
        Network Throughput
      </h3>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={history.qps}>
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
            <Line
              type="monotone"
              dataKey="value"
              name="Queries/Sec"
              stroke="#00ff9d"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ClusterOverview;
