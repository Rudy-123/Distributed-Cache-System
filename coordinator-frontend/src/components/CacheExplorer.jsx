import React, { useState } from "react";
import axios from "axios";
function CacheExplorer() {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [ttl, setTtl] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const handleSet = async () => {
    //adding data
    setLoading(true);
    try {
      const res = await axios.post(
        "/api/cache",
        { key, value, ttl: parseInt(ttl) || 0 },
        { headers },
      );
      setResponse(res.data);
    } catch (err) {
      setResponse({ error: err.response ? err.response.data : err.message });
    }
    setLoading(false);
  };

  const handleGet = async () => {
    //retrieve data
    try {
      const res = await axios.get("/api/cache/${key}", { headers });
      setResponse(res.data);
    } catch (err) {
      setResponse({ error: err.response ? err.response.data : err.message });
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    try {
      const res = await axios.delete("/api/cache/${key}", { headers });
      setResponse(res.data);
    } catch (err) {
      setResponse({ error: err.response ? err.response.data : err.message });
    }
    setLoading(false);
  };
}

return (
  <div
    style={{
      padding: "24px",
      background: "#0f1523",
      border: "1px solid #1e2d45",
      borderRadius: "12px",
      marginTop: "24px",
    }}
  >
    <h3 style={{ marginBottom: "16px", color: "#e8f4ff" }}>
      Cache Explorer Terminal
    </h3>
    <div
      style={{
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        marginBottom: "16px",
      }}
    >
      <input
        placeholder="Key"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        style={{
          padding: "8px 12px",
          background: "#151d2e",
          border: "1px solid #1e2d45",
          borderRadius: "6px",
          color: "#e8f4ff",
        }}
      />
      <input
        placeholder="Value"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          padding: "8px 12px",
          background: "#151d2e",
          border: "1px solid #1e2d45",
          borderRadius: "6px",
          color: "#e8f4ff",
        }}
      />
      <input
        placeholder="TTL (seconds)"
        value={ttl}
        onChange={(e) => setTtl(e.target.value)}
        style={{
          padding: "8px 12px",
          background: "#151d2e",
          border: "1px solid #1e2d45",
          borderRadius: "6px",
          color: "#e8f4ff",
        }}
      />
    </div>
    <div style={{ display: "flex", gap: "12px" }}>
      <button
        onClick={handleSet}
        disabled={loading}
        style={{
          padding: "8px 16px",
          background: "#00ff9d",
          border: "none",
          borderRadius: "6px",
          color: "#0a0e17",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        SET
      </button>
      <button
        onClick={handleGet}
        disabled={loading}
        style={{
          padding: "8px 16px",
          background: "#4da6ff",
          border: "none",
          borderRadius: "6px",
          color: "#0a0e17",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        GET
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        style={{
          padding: "8px 16px",
          background: "#ff4757",
          border: "none",
          borderRadius: "6px",
          color: "#e8f4ff",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        DELETE
      </button>
    </div>
    {response && (
      <pre
        style={{
          marginTop: "16px",
          background: "#070a10",
          padding: "16px",
          borderRadius: "8px",
          border: "1px solid #1e2d45",
          color: "#00ff9d",
          fontSize: "11px",
          overflowX: "auto",
        }}
      >
        {JSON.stringify(response, null, 2)}
      </pre>
    )}
  </div>
);

export default CacheExplorer;
