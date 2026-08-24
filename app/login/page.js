"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

function CrossedSpears() {
  return (
    <svg
      viewBox="0 0 240 240"
      className="login-glow"
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(80vw, 80vh)",
        height: "min(80vw, 80vh)",
        opacity: 0.13,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {[45, -45].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 120 120)`}>
          <line x1="120" y1="4" x2="120" y2="236" stroke="#e8d9a0" strokeWidth="1.5" />
          <path d="M120 0 L136 36 L120 27 L104 36 Z" fill="#e8d9a0" />
          <line x1="102" y1="42" x2="138" y2="42" stroke="#e8d9a0" strokeWidth="1.5" />
        </g>
      ))}
    </svg>
  );
}

function Crest() {
  return (
    <div className="login-rise" style={{ marginBottom: 20, animationDelay: "0s" }}>
      <svg className="login-crest" width="76" height="76" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 1.5 21 5.5V11c0 6-4 9.5-9 11.5C7 20.5 3 17 3 11V5.5L12 1.5Z"
          stroke="#c9a227"
          strokeWidth="1.2"
        />
        <path d="M12 6 16 8v3.2c0 3-1.7 5-4 6.3-2.3-1.3-4-3.3-4-6.3V8L12 6Z" fill="#c9a227" fillOpacity="0.9" />
      </svg>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Email or password isn't right. Try again, or ask your admin to reset it.");
    } else {
      window.location.href = "/leads";
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at center, rgba(14,14,15,0.4) 0%, rgba(14,14,15,0.85) 55%, #0e0e0f 85%), #0e0e0f",
        overflowY: "auto",
      }}
    >
      <CrossedSpears />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 720, width: "100%", textAlign: "center", padding: "48px 24px" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Crest />
        </div>
        <p
          className="login-rise"
          style={{
            color: "#c9a227",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: 5,
            textTransform: "uppercase",
            marginBottom: 18,
            animationDelay: "0.15s",
          }}
        >
          The Upper Echelon
        </p>
        <h1
          className="login-rise"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(42px, 7vw, 76px)",
            fontWeight: 600,
            color: "#f5f5f5",
            marginBottom: 14,
            lineHeight: 1.1,
            animationDelay: "0.3s",
          }}
        >
          Welcome to
          <br />
          <span className="login-wordmark" style={{ fontStyle: "italic" }}>
            NobleDesk
          </span>
        </h1>
        <div
          className="login-rise"
          style={{
            width: 72,
            height: 3,
            margin: "0 auto 28px",
            borderRadius: 2,
            background: "linear-gradient(90deg, transparent, #c9a227, transparent)",
            animationDelay: "0.45s",
          }}
        />
        <p className="subtitle login-rise" style={{ marginBottom: 36, fontSize: 16, animationDelay: "0.55s" }}>
          Log in with the email and password your admin gave you.
        </p>
        {error && <p className="error">{error}</p>}
        <div
          className="login-rise"
          style={{
            textAlign: "left",
            maxWidth: 440,
            margin: "0 auto",
            background: "rgba(22, 22, 22, 0.55)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(201, 162, 39, 0.22)",
            borderRadius: 20,
            padding: "32px 28px",
            boxShadow: "0 20px 60px -20px rgba(0, 0, 0, 0.6)",
            animationDelay: "0.65s",
          }}
        >
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
              style={{ padding: "16px 18px", fontSize: 16, marginBottom: 16 }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ padding: "16px 18px", fontSize: 16, marginBottom: 8 }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                borderRadius: 999,
                padding: "16px 20px",
                marginTop: 12,
                fontSize: 16,
                letterSpacing: 0.3,
              }}
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>
        </div>
        <p className="subtitle login-rise" style={{ marginTop: 28, marginBottom: 0, fontSize: 12, animationDelay: "0.8s" }}>
          <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          {" "}&middot;{" "}
          <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
        </p>
      </div>
    </div>
  );
}
