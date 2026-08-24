"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import Crest from "@/app/components/Crest";
import TempleBackdrop from "@/app/components/TempleBackdrop";

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
      window.location.href = "/";
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
      <TempleBackdrop />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 720, width: "100%", textAlign: "center", padding: "48px 24px" }}>
        <div className="login-rise" style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <Crest size={76} glow />
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
