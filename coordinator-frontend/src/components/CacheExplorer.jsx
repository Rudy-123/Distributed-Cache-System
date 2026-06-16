import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const termStyles = `
  @keyframes cursorBlink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  @keyframes scanlineAnim {
    0% { top: -5%; }
    100% { top: 105%; }
  }
  @keyframes cmdFlash {
    0% { background: rgba(63, 185, 80, 0.05); }
    100% { background: transparent; }
  }
  .term-entry {
    transition: background 0.2s ease;
    border-radius: 4px;
    padding: 8px 10px;
    margin: 0 -10px;
  }
  .term-entry:hover {
    background: rgba(255, 255, 255, 0.015) !important;
  }
  .term-btn {
    transition: all 0.2s ease !important;
  }
  .term-btn:hover:not(:disabled) {
    transform: translateY(-1px) !important;
    filter: brightness(1.2) !important;
  }
  .term-input:focus {
    border-color: rgba(63, 185, 80, 0.4) !important;
    box-shadow: 0 0 0 2px rgba(63, 185, 80, 0.08) !important;
  }
  .term-scroll::-webkit-scrollbar { width: 4px; }
  .term-scroll::-webkit-scrollbar-track { background: transparent; }
  .term-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
`;

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
        message: "Welcome to Distributed Cache Explorer CLI.",
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

  // Syntax highlight JSON output
  const renderJsonValue = (obj) => {
    if (typeof obj !== "object") return <span style={{ color: "var(--text-secondary)" }}>{String(obj)}</span>;
    const json = JSON.stringify(obj, null, 2);
    // Color JSON keys and values differently
    const highlighted = json.replace(
      /"([^"]+)"(:)?/g,
      (match, p1, p2) => {
        if (p2) {
          // This is a key
          return `<span style="color: #a855f7">"${p1}"</span>:`;
        }
        // This is a string value
        return `<span style="color: #3fb950">"${p1}"</span>`;
      }
    ).replace(
      /\b(\d+\.?\d*)\b/g,
      '<span style="color: #f59e0b">$1</span>'
    );
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  return (
    <>
      <style>{termStyles}</style>
      <div
        className="obs-card"
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
          border: "1px solid var(--border-subtle)",
          background: "#030508",
          borderRadius: "12px",
        }}
      >
        {/* Terminal Header Chrome */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(180deg, #1a1f2e, #141926)",
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", gap: "7px", alignItems: "center" }}>
            <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#ff5f56", display: "inline-block", boxShadow: "0 0 6px rgba(255,95,86,0.3)" }} />
            <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#ffbd2e", display: "inline-block", boxShadow: "0 0 6px rgba(255,189,46,0.3)" }} />
            <span style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#27c93f", display: "inline-block", boxShadow: "0 0 6px rgba(39,201,63,0.3)" }} />
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.5px" }}>
            cache-cli@coordinator-node
          </span>
          <button
            onClick={clearLogs}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
              fontSize: "9px",
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
              padding: "3px 10px",
              borderRadius: "4px",
              fontWeight: "600",
              letterSpacing: "0.5px",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => { e.target.style.color = "var(--text-primary)"; e.target.style.borderColor = "var(--border-muted)"; }}
            onMouseOut={(e) => { e.target.style.color = "var(--text-muted)"; e.target.style.borderColor = "var(--border-subtle)"; }}
          >
            CLEAR
          </button>
        </div>

        {/* Terminal Screen */}
        <div
          className="term-scroll"
          style={{
            padding: "16px",
            height: "240px",
            overflowY: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            lineHeight: "1.6",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            background: "#020408",
            position: "relative",
          }}
        >
          {/* Scanline effect */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              background: "linear-gradient(180deg, transparent, rgba(63, 185, 80, 0.03), transparent)",
              animation: "scanlineAnim 4s linear infinite",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />

          {terminalHistory.map((item, index) => {
            const isError = item.type === "error";
            const isInfo = item.type === "info";
            const cmdColor = isError ? "var(--color-critical)" : isInfo ? "var(--color-info)" : "var(--color-success)";

            return (
              <div key={index} className="term-entry" style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", paddingBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "9px", marginBottom: "6px", fontWeight: "600", letterSpacing: "0.5px" }}>
                  <span>{item.timestamp}</span>
                  <span style={{ color: cmdColor }}>
                    <span style={{ color: "var(--text-muted)" }}>CMD:</span> {item.command}
                  </span>
                </div>
                <div style={{ color: cmdColor, whiteSpace: "pre-wrap" }}>
                  {renderJsonValue(item.output)}
                </div>
              </div>
            );
          })}
          <div ref={historyEndRef} />
        </div>

        {/* Terminal Input Bar */}
        <div
          style={{
            padding: "16px",
            background: "linear-gradient(180deg, #0a0e18, #080c14)",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-success)", display: "flex", alignItems: "center", gap: "2px", fontWeight: "600" }}>
              cache-cli &gt;
              <span style={{ display: "inline-block", width: "7px", height: "14px", background: "var(--color-success)", animation: "cursorBlink 1s step-end infinite", marginLeft: "2px" }} />
            </span>
            {[
              { ph: "Key", val: key, set: setKey, flex: "1 1 110px" },
              { ph: "Value", val: value, set: setValue, flex: "2 1 160px" },
              { ph: "TTL (s)", val: ttl, set: setTtl, flex: "0 1 70px" },
            ].map((inp, i) => (
              <input
                key={i}
                className="term-input"
                placeholder={inp.ph}
                value={inp.val}
                onChange={(e) => inp.set(e.target.value)}
                style={{
                  flex: inp.flex,
                  padding: "8px 12px",
                  background: "rgba(6, 9, 15, 0.8)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "6px",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
              />
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            {[
              { label: "GET", handler: handleGet, bg: "var(--color-info-bg)", border: "var(--color-info)", color: "var(--color-info)" },
              { label: "SET", handler: handleSet, bg: "var(--color-success-bg)", border: "var(--color-success)", color: "var(--color-success)" },
              { label: "DELETE", handler: handleDelete, bg: "var(--color-critical-bg)", border: "var(--color-critical)", color: "var(--color-critical)" },
            ].map((btn) => (
              <button
                key={btn.label}
                className="term-btn"
                onClick={btn.handler}
                disabled={loading || !key}
                style={{
                  padding: "7px 16px",
                  background: btn.bg,
                  border: `1px solid ${btn.border}`,
                  borderRadius: "6px",
                  color: btn.color,
                  fontWeight: "700",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  cursor: !key ? "not-allowed" : "pointer",
                  opacity: !key ? 0.4 : 1,
                  letterSpacing: "0.5px",
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default CacheExplorer;
