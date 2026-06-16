import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../store/authSlice";

const styles = `
  @keyframes auroraMove {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes cardFadeIn {
    from { opacity: 0; transform: translateY(24px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes floatDot {
    0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
    50% { transform: translateY(-20px) scale(1.3); opacity: 0.6; }
  }
  @keyframes inputGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(63, 185, 80, 0); }
    50% { box-shadow: 0 0 12px 2px rgba(63, 185, 80, 0.15); }
  }
  @keyframes spinLoader {
    to { transform: rotate(360deg); }
  }
  .login-input:focus {
    border-color: var(--color-success) !important;
    box-shadow: 0 0 0 3px rgba(63, 185, 80, 0.1), 0 0 20px rgba(63, 185, 80, 0.08) !important;
    outline: none;
  }
  .login-btn:hover:not(:disabled) {
    box-shadow: 0 0 30px rgba(63, 185, 80, 0.3), 0 4px 16px rgba(0, 0, 0, 0.3) !important;
    transform: translateY(-1px) !important;
  }
  .login-btn:active:not(:disabled) {
    transform: translateY(0px) !important;
  }
`;

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  // Floating particles
  const particles = Array.from({ length: 30 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 5,
    duration: Math.random() * 4 + 3,
  }));

  return (
    <>
      <style>{styles}</style>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "linear-gradient(-45deg, #06090f, #0a1628, #0f0a1e, #061218, #06090f)",
          backgroundSize: "400% 400%",
          animation: "auroraMove 20s ease infinite",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Floating particles */}
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: "50%",
              backgroundColor: i % 3 === 0 ? "rgba(63, 185, 80, 0.3)" : i % 3 === 1 ? "rgba(88, 166, 255, 0.2)" : "rgba(168, 85, 247, 0.2)",
              animation: `floatDot ${p.duration}s ease-in-out ${p.delay}s infinite`,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Radial glow behind card */}
        <div
          style={{
            position: "absolute",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(63, 185, 80, 0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Login Card */}
        <form
          onSubmit={handleSubmit}
          style={{
            width: "380px",
            padding: "40px 36px",
            background: "linear-gradient(135deg, rgba(13, 17, 26, 0.85), rgba(22, 27, 34, 0.75))",
            border: "1px solid rgba(48, 54, 61, 0.5)",
            borderRadius: "20px",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 24px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
            animation: "cardFadeIn 0.6s ease-out forwards",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Top accent line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "20%",
              right: "20%",
              height: "2px",
              background: "linear-gradient(90deg, transparent, var(--color-success), var(--color-info), transparent)",
              borderRadius: "2px",
            }}
          />

          {/* Logo/Icon area */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, rgba(63, 185, 80, 0.15), rgba(88, 166, 255, 0.1))",
                border: "1px solid rgba(63, 185, 80, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: "24px",
              }}
            >
              ◈
            </div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: "800",
                margin: "0 0 6px 0",
                background: "linear-gradient(135deg, #3fb950, #58a6ff, #a855f7)",
                backgroundSize: "200% 200%",
                animation: "auroraMove 6s ease infinite",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.5px",
              }}
            >
              Distributed Cache System
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                color: "var(--text-secondary)",
                letterSpacing: "0.5px",
              }}
            >
              Real-time Cluster Monitoring Console
            </p>
          </div>

          {/* Error display */}
          {error && (
            <div
              style={{
                background: "var(--color-critical-bg)",
                border: "1px solid rgba(248, 81, 73, 0.2)",
                borderRadius: "10px",
                padding: "10px 16px",
                marginBottom: "20px",
                textAlign: "center",
                fontSize: "12px",
                color: "var(--color-critical)",
                fontWeight: "500",
              }}
            >
              ⚠ {error}
            </div>
          )}

          {/* Email input */}
          <div style={{ marginBottom: "18px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "11px",
                fontWeight: "600",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              Email Address
            </label>
            <input
              className="login-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@cluster.local"
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "rgba(6, 9, 15, 0.6)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px",
                color: "var(--text-primary)",
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                boxSizing: "border-box",
                transition: "all 0.3s ease",
              }}
            />
          </div>

          {/* Password input */}
          <div style={{ marginBottom: "28px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "11px",
                fontWeight: "600",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              Password
            </label>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "rgba(6, 9, 15, 0.6)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px",
                color: "var(--text-primary)",
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                boxSizing: "border-box",
                transition: "all 0.3s ease",
              }}
            />
          </div>

          {/* Submit button */}
          <button
            className="login-btn"
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              background: loading ? "var(--bg-tertiary)" : "linear-gradient(135deg, #3fb950, #2ea043)",
              border: "none",
              borderRadius: "10px",
              color: loading ? "var(--text-secondary)" : "#ffffff",
              fontWeight: "700",
              fontSize: "14px",
              fontFamily: "var(--font-sans)",
              cursor: loading ? "wait" : "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              letterSpacing: "0.3px",
            }}
          >
            {loading && (
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spinLoader 0.6s linear infinite",
                }}
              />
            )}
            {loading ? "Authenticating..." : "Sign In →"}
          </button>

          {/* Footer */}
          <p
            style={{
              textAlign: "center",
              marginTop: "24px",
              marginBottom: 0,
              fontSize: "10px",
              color: "var(--text-muted)",
              letterSpacing: "0.5px",
            }}
          >
            Secured with JWT Authentication · v2.0
          </p>
        </form>
      </div>
    </>
  );
}

export default LoginPage;
