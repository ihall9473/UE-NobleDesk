"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

function CrossedSpears() {
  return (
    <svg
      viewBox="0 0 240 240"
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(90vw, 90vh)",
        height: "min(90vw, 90vh)",
        opacity: 0.16,
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
      <div style={{ position: "relative", zIndex: 1, maxWidth: 400, width: "100%", textAlign: "center", padding: "40px 20px" }}>
        <p
          style={{
            color: "#c9a227",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          The Upper Echelon
        </p>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(38px, 7vw, 64px)",
            fontWeight: 600,
            color: "#f5f5f5",
            marginBottom: 10,
            lineHeight: 1.1,
          }}
        >
          Welcome to <span style={{ fontStyle: "italic", color: "#c9a227" }}>NobleDesk</span>
        </h1>
        <p className="subtitle" style={{ marginBottom: 32 }}>
          Log in with the email and password your admin gave you.
        </p>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", borderRadius: 999, padding: "12px 18px", marginTop: 4 }}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}
