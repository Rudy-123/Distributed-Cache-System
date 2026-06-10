import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

function CacheExplorer() {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [ttl, setTtl] = useState("");
  const [loading, setLoading] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState([
    {
      timestamp: new Date().toLocaleTimeString(),
      command: "HELP",
      type: "info",
      output: {
        message: "Welcome to Distributed Cache Explorer CLI CLI.",
        available_ops: ["SET <key> <value> [ttl_sec]", "GET <key>", "DELETE <key>"],
        cluster: "healthy",
      },
    },
  ]);

  const historyEndRef = useRef(null);
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const scrollToBottom = () => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [terminalHistory]);

  const logCommand = (cmdText, status, resData) => {
    setTerminalHistory((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        command: cmdText,
        type: status,
        output: resData,
      },
    ]);
  };

  const handleSet = async () => {
    if (!key) return;
    setLoading(true);
    const cmdText = `SET ${key} ${value || '""'} ${ttl ? `${ttl}s` : ""}`;
    try {
      const res = await axios.post(
        "/api/cache",
        { key, value, ttl: parseInt(ttl) || 0 },
        { headers }
      );
      logCommand(cmdText, "success", res.data);
      setValue("");
      setTtl("");
    } catch (err) {
      logCommand(cmdText, "error", err.response ? err.response.data : { error: err.message });
    }
    setLoading(false);
  };

  const handleGet = async () => {
    if (!key) return;
    setLoading(true);
    const cmdText = `GET ${key}`;
    try {
      const res = await axios.get(`/api/cache/${key}`, { headers });
      logCommand(cmdText, "success", res.data);
    } catch (err) {
      logCommand(cmdText, "error", err.response ? err.response.data : { error: err.message });
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!key) return;
    setLoading(true);
    const cmdText = `DELETE ${key}`;
    try {
      const res = await axios.delete(`/api/cache/${key}`, { headers });
      logCommand(cmdText, "success", res.data);
    } catch (err) {
      logCommand(cmdText, "error", err.response ? err.response.data : { error: err.message });
    }
    setLoading(false);
  };

  const clearLogs = () => {
    setTerminalHistory([]);
  };

  return (
    <div
      className="obs-card"
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 0,
        overflow: "hidden",
        border: "1px solid var(--border-subtle)",
        background: "#05070c",
      }}
    >
      {/* Terminal Header Chroming */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-tertiary)",
          padding: "10px 16px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f56", display: "inline-block" }} />
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ffbd2e", display: "inline-block" }} />
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#27c93f", display: "inline-block" }} />
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>
          cache-cli@coordinator-node
        </span>
        <button
          onClick={clearLogs}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            fontSize: "10px",
            fontFamily: "var(--font-mono)",
            cursor: "pointer",
          }}
          onMouseOver={(e) => (e.target.style.color = "var(--text-primary)")}
          onMouseOut={(e) => (e.target.style.color = "var(--text-secondary)")}
        >
          CLEAR
        </button>
      </div>

      {/* Terminal Screen Terminal Logs */}
      <div
        style={{
          padding: "16px",
          height: "220px",
          overflowY: "auto",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          lineHeight: "1.5",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          background: "#020408",
        }}
      >
        {terminalHistory.map((item, index) => {
          const isError = item.type === "error";
          const isInfo = item.type === "info";
          const cmdColor = isError ? "var(--color-critical)" : isInfo ? "var(--color-info)" : "var(--color-success)";

          return (
            <div key={index} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", paddingBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: "10px", marginBottom: "4px" }}>
                <span>{item.timestamp}</span>
                <span>CMD: {item.command}</span>
              </div>
              <div style={{ color: cmdColor, whiteSpace: "pre-wrap" }}>
                {typeof item.output === "object" ? JSON.stringify(item.output, null, 2) : item.output}
              </div>
            </div>
          );
        })}
        <div ref={historyEndRef} />
      </div>

      {/* Terminal Interaction Bar */}
      <div
        style={{
          padding: "14px 16px",
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-success)" }}>
            cache-cli &gt;
          </span>
          <input
            placeholder="Key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            style={{
              flex: "1 1 120px",
              padding: "6px 10px",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "4px",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              outline: "none",
            }}
          />
          <input
            placeholder="Value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{
              flex: "2 1 180px",
              padding: "6px 10px",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "4px",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              outline: "none",
            }}
          />
          <input
            placeholder="TTL (sec)"
            value={ttl}
            onChange={(e) => setTtl(e.target.value)}
            style={{
              flex: "0 1 80px",
              padding: "6px 10px",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "4px",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={handleGet}
            disabled={loading || !key}
            style={{
              padding: "6px 14px",
              background: "var(--color-info-bg)",
              border: "1px solid var(--color-info)",
              borderRadius: "4px",
              color: "var(--color-info)",
              fontWeight: "600",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              cursor: "pointer",
              opacity: !key ? 0.5 : 1,
            }}
          >
            GET
          </button>
          <button
            onClick={handleSet}
            disabled={loading || !key}
            style={{
              padding: "6px 14px",
              background: "var(--color-success-bg)",
              border: "1px solid var(--color-success)",
              borderRadius: "4px",
              color: "var(--color-success)",
              fontWeight: "600",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              cursor: "pointer",
              opacity: !key ? 0.5 : 1,
            }}
          >
            SET
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || !key}
            style={{
              padding: "6px 14px",
              background: "var(--color-critical-bg)",
              border: "1px solid var(--color-critical)",
              borderRadius: "4px",
              color: "var(--color-critical)",
              fontWeight: "600",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              cursor: "pointer",
              opacity: !key ? 0.5 : 1,
            }}
          >
            DELETE
          </button>
        </div>
      </div>
    </div>
  );
}

export default CacheExplorer;
