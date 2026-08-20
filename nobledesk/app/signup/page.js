"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function SignupPage() {
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState(params.get("code") || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, inviteCode }),
    });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Something went wrong.");
      return;
    }

    // Account created - log them straight in.
    const supabase = supabaseBrowser();
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (loginErr) {
      window.location.href = "/login";
    } else {
      window.location.href = "/settings";
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "60px auto" }}>
      <h1>Create your UE NobleDesk account</h1>
      <p className="subtitle">
        You'll set up your own Twilio texting number in the next step, billed to you directly.
      </p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input
          type="password"
          placeholder="Password (8+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          placeholder="Invite code"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>{loading ? "Creating account..." : "Create Account"}</button>
      </form>
      <p className="subtitle" style={{ marginTop: 16 }}>
        Already have an account? <a href="/login" style={{ color: "#4f46e5" }}>Log in</a>
      </p>
    </div>
  );
}
