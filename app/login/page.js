"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

function CrossedSpears() {
  return (
    <svg
      viewBox="0 0 240 240"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 420,
        height: 420,
        opacity: 0.14,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {[45, -45].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 120 120)`}>
          <line x1="120" y1="20" x2="120" y2="220" stroke="#e8d9a0" strokeWidth="2.5" />
          <path d="M120 8 L134 40 L120 32 L106 40 Z" fill="#e8d9a0" />
          <line x1="104" y1="46" x2="136" y2="46" stroke="#e8d9a0" strokeWidth="2.5" />
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
    <div style={{ position: "relative", minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CrossedSpears />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 380, width: "100%", textAlign: "center", padding: "0 20px" }}>
        <p
          style={{
            color: "#c9a227",
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          The Upper Echelon
        </p>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 42,
            fontWeight: 600,
            color: "#f5f5f5",
            marginBottom: 8,
            lineHeight: 1.15,
          }}
        >
          Welcome to <span style={{ fontStyle: "italic", color: "#c9a227" }}>NobleDesk</span>
        </h1>
        <p className="subtitle" style={{ marginBottom: 28 }}>
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
