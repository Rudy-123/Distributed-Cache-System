import React, { useMemo } from "react";
import { useSelector } from "react-redux";

function ClusterTopology() {
  const { nodes } = useSelector((state) => state.cluster);

  const topologyData = useMemo(() => {
    const leader = nodes.find((n) => n.role === "master" || n.role === "leader");
    const replicas = nodes.filter((n) => n.role !== "master" && n.role !== "leader");

    const width = 700;
    const height = 480;
    const center = { x: width / 2, y: height / 2 };
    const orbitRadius = 160;

    const nodesWithCoords = [];

    if (leader) {
      nodesWithCoords.push({
        ...leader,
        x: center.x,
        y: center.y,
        isLeader: true,
      });
    }

    replicas.forEach((rep, index) => {
      const angle = (index * 2 * Math.PI) / (replicas.length || 1) - Math.PI / 2;
      nodesWithCoords.push({
        ...rep,
        x: center.x + orbitRadius * Math.cos(angle),
        y: center.y + orbitRadius * Math.sin(angle),
        isLeader: false,
      });
    });

    return { nodes: nodesWithCoords, center, width, height, orbitRadius };
  }, [nodes]);

  const activeCount = topologyData.nodes.filter((n) => n.status === "healthy").length;
  const totalCount = topologyData.nodes.length;

  return (
    <div
      className="obs-card"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
      }}
    >
      {/* Header Row */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "16px",
        }}
      >
        <div>
          <span className="obs-header" style={{ margin: 0 }}>
            Cluster Network Topology
          </span>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "11px",
              color: "var(--text-secondary)",
            }}
          >
            Real-time visualization of leader-replica consensus ring and data replication flows
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
          <span
            style={{
              fontSize: "10px",
              color: "var(--text-secondary)",
              background: "var(--bg-tertiary)",
              padding: "4px 10px",
              borderRadius: "4px",
              border: "1px solid var(--border-subtle)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Quorum: {activeCount}/{totalCount}
          </span>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: activeCount === totalCount && activeCount > 0 ? "var(--color-success)" : "var(--color-warning)",
              boxShadow: `0 0 8px ${activeCount === totalCount && activeCount > 0 ? "var(--color-success-glow)" : "var(--color-warning-bg)"}`,
              display: "inline-block",
            }}
          />
        </div>
      </div>

      {/* SVG Topology Canvas */}
      <div style={{ width: "100%", position: "relative", textAlign: "center" }}>
        {topologyData.nodes.length === 0 ? (
          <div
            style={{
              height: "400px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)",
              fontSize: "13px",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
            No active nodes discovered in cluster ring.
          </div>
        ) : (
          <svg
            width="100%"
            height="440"
            viewBox={`0 0 ${topologyData.width} ${topologyData.height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ overflow: "visible" }}
          >
            {/* ───── SVG Definitions: Gradients, Filters, Patterns ───── */}
            <defs>
              {/* Leader node radial gradient */}
              <radialGradient id="leaderGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3fb950" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0d111a" stopOpacity="0.9" />
              </radialGradient>

              {/* Replica node radial gradient */}
              <radialGradient id="replicaGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3fb950" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0d111a" stopOpacity="0.9" />
              </radialGradient>

              {/* Dead node gradient */}
              <radialGradient id="deadGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f85149" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0d111a" stopOpacity="0.9" />
              </radialGradient>

              {/* Leader outer glow filter */}
              <filter id="leaderGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Node drop shadow */}
              <filter id="nodeShadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.6)" />
              </filter>

              {/* Animated dash pattern for data flow lines */}
              <pattern id="gridDot" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="0.5" fill="var(--border-subtle)" />
              </pattern>
            </defs>

            {/* ───── Background: Dot grid + Concentric radar rings ───── */}
            <rect width={topologyData.width} height={topologyData.height} fill="url(#gridDot)" opacity="0.5" />

            {/* Concentric orbital guide rings */}
            {[60, 120, topologyData.orbitRadius, topologyData.orbitRadius + 40].map((r, i) => (
              <circle
                key={`ring-${i}`}
                cx={topologyData.center.x}
                cy={topologyData.center.y}
                r={r}
                fill="none"
                stroke="var(--border-subtle)"
                strokeWidth="0.5"
                strokeDasharray={i === 2 ? "none" : "3 6"}
                opacity={i === 2 ? 0.5 : 0.25}
              />
            ))}

            {/* Cross-hair center lines */}
            <line
              x1={topologyData.center.x}
              y1={topologyData.center.y - topologyData.orbitRadius - 50}
              x2={topologyData.center.x}
              y2={topologyData.center.y + topologyData.orbitRadius + 50}
              stroke="var(--border-subtle)"
              strokeWidth="0.5"
              strokeDasharray="4 8"
              opacity="0.2"
            />
            <line
              x1={topologyData.center.x - topologyData.orbitRadius - 50}
              y1={topologyData.center.y}
              x2={topologyData.center.x + topologyData.orbitRadius + 50}
              y2={topologyData.center.y}
              stroke="var(--border-subtle)"
              strokeWidth="0.5"
              strokeDasharray="4 8"
              opacity="0.2"
            />

            {/* ───── Connection Lines: Leader → Replicas ───── */}
            {topologyData.nodes.map(
              (node) =>
                !node.isLeader && (
                  <g key={`link-${node.nodeId}`}>
                    {/* Base link line */}
                    <line
                      x1={topologyData.center.x}
                      y1={topologyData.center.y}
                      x2={node.x}
                      y2={node.y}
                      stroke={node.status === "healthy" ? "rgba(63,185,80,0.15)" : "rgba(248,81,73,0.1)"}
                      strokeWidth="2"
                    />

                    {/* Active dashed overlay link */}
                    {node.status === "healthy" && (
                      <line
                        x1={topologyData.center.x}
                        y1={topologyData.center.y}
                        x2={node.x}
                        y2={node.y}
                        stroke="rgba(63,185,80,0.4)"
                        strokeWidth="1"
                        strokeDasharray="6 4"
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          values="0;-20"
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                      </line>
                    )}

                    {/* Data flow particle: leader → replica */}
                    {node.status === "healthy" && (
                      <>
                        <circle r="3" fill="var(--color-success)" opacity="0.9">
                          <animateMotion
                            dur="2.8s"
                            repeatCount="indefinite"
                            path={`M ${topologyData.center.x} ${topologyData.center.y} L ${node.x} ${node.y}`}
                          />
                          <animate attributeName="opacity" values="1;0.3;1" dur="2.8s" repeatCount="indefinite" />
                        </circle>
                        {/* Second trailing particle */}
                        <circle r="2" fill="var(--color-success)" opacity="0.6">
                          <animateMotion
                            dur="2.8s"
                            repeatCount="indefinite"
                            begin="1.4s"
                            path={`M ${topologyData.center.x} ${topologyData.center.y} L ${node.x} ${node.y}`}
                          />
                          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.8s" repeatCount="indefinite" begin="1.4s" />
                        </circle>
                      </>
                    )}


                  </g>
                ),
            )}

            {/* ───── Node Circles ───── */}
            {topologyData.nodes.map((node) => {
              const isHealthy = node.status === "healthy";
              const statusColor = isHealthy
                ? "var(--color-success)"
                : "var(--color-critical)";
              const nodeRadius = node.isLeader ? 30 : 22;
              const gradId = !isHealthy ? "url(#deadGrad)" : node.isLeader ? "url(#leaderGrad)" : "url(#replicaGrad)";

              return (
                <g key={`node-${node.nodeId}`} style={{ cursor: "pointer" }}>
                  {/* Leader rotating dashed orbit ring */}
                  {node.isLeader && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="42"
                      fill="none"
                      stroke="var(--color-success)"
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                      opacity="0.5"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from={`0 ${node.x} ${node.y}`}
                        to={`360 ${node.x} ${node.y}`}
                        dur="12s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Outer halo glow */}
                  {isHealthy && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={nodeRadius + 6}
                      fill="none"
                      stroke={statusColor}
                      strokeWidth="1"
                      opacity="0.15"
                    />
                  )}

                  {/* Main node circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={nodeRadius}
                    fill={gradId}
                    stroke={statusColor}
                    strokeWidth="2.5"
                    filter="url(#nodeShadow)"
                  />

                  {/* Heartbeat pulse ring */}
                  {isHealthy && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={nodeRadius}
                      fill="none"
                      stroke={statusColor}
                      strokeWidth="1.5"
                    >
                      <animate
                        attributeName="r"
                        values={`${nodeRadius};${nodeRadius + 18}`}
                        dur="2.5s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.6;0"
                        dur="2.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Icon inside node */}
                  {node.isLeader ? (
                    <>
                      {/* Crown/star icon for leader */}
                      <text
                        x={node.x}
                        y={node.y - 4}
                        fill="var(--color-success)"
                        fontSize="14"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        ★
                      </text>
                      <text
                        x={node.x}
                        y={node.y + 10}
                        fill="var(--color-success)"
                        fontSize="7"
                        fontWeight="800"
                        fontFamily="var(--font-mono)"
                        textAnchor="middle"
                        letterSpacing="1"
                      >
                        LEADER
                      </text>
                    </>
                  ) : (
                    <>
                      {/* Database icon for replicas */}
                      <text
                        x={node.x}
                        y={node.y - 2}
                        fill={isHealthy ? "var(--color-success)" : "var(--color-critical)"}
                        fontSize="12"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        ⬡
                      </text>
                      <text
                        x={node.x}
                        y={node.y + 10}
                        fill={isHealthy ? "var(--color-success)" : "var(--text-muted)"}
                        fontSize="6"
                        fontWeight="700"
                        fontFamily="var(--font-mono)"
                        textAnchor="middle"
                        letterSpacing="0.5"
                      >
                        REPLICA
                      </text>
                    </>
                  )}

                  {/* Node ID Label below the node */}
                  <text
                    x={node.x}
                    y={node.y + nodeRadius + 16}
                    fill="var(--text-primary)"
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="var(--font-sans)"
                    textAnchor="middle"
                  >
                    {node.nodeId}
                  </text>



                  {/* Status dot indicator on top-right */}
                  <circle
                    cx={node.x + nodeRadius - 4}
                    cy={node.y - nodeRadius + 4}
                    r="4"
                    fill={isHealthy ? "var(--color-success)" : "var(--color-critical)"}
                    stroke="var(--bg-secondary)"
                    strokeWidth="1.5"
                  >
                    {isHealthy && (
                      <animate
                        attributeName="opacity"
                        values="1;0.4;1"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    )}
                  </circle>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Legend Row */}
      {topologyData.nodes.length > 0 && (
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: "24px",
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          {[
            { color: "var(--color-success)", label: "Leader Node" },
            { color: "var(--color-success)", label: "Replica Node" },
            { color: "var(--color-critical)", label: "Offline" },
            { color: "var(--color-success)", label: "Data Flow", isDashed: true },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "10px",
                color: "var(--text-secondary)",
              }}
            >
              {item.isDashed ? (
                <svg width="16" height="8">
                  <line
                    x1="0"
                    y1="4"
                    x2="16"
                    y2="4"
                    stroke={item.color}
                    strokeWidth="2"
                    strokeDasharray="3 2"
                  />
                  <circle cx="14" cy="4" r="2" fill={item.color} />
                </svg>
              ) : (
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: item.color,
                    display: "inline-block",
                    boxShadow: `0 0 4px ${item.color}`,
                  }}
                />
              )}
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClusterTopology;
