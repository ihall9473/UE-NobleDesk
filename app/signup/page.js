"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { TEXTING_ENABLED, APP_NAME } from "@/lib/features";

const ROLE_LABELS = { admin: "Admin", manager: "Manager", agent: "Agent" };

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ maxWidth: 360, margin: "60px auto" }}>Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const params = useSearchParams();
  const inviteId = params.get("invite") || "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lastName, setLastName] = useState("");
  const [invite, setInvite] = useState(null);
  const [checkedInvite, setCheckedInvite] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!inviteId) {
      setCheckedInvite(true);
      return;
    }
    fetch(`/api/signup?invite=${encodeURIComponent(inviteId)}`)
      .then((r) => r.json())
      .then((d) => {
        setInvite(d.invite);
        setCheckedInvite(true);
      })
      .catch(() => setCheckedInvite(true));
  }, [inviteId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, inviteId, lastName }),
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
      window.location.href = TEXTING_ENABLED ? "/settings" : "/leads";
    }
  }

  if (!checkedInvite) {
    return <div style={{ maxWidth: 360, margin: "60px auto" }}>Loading...</div>;
  }

  if (!inviteId || !invite || invite.used) {
    return (
      <div style={{ maxWidth: 360, margin: "60px auto" }}>
        <h1>Invite required</h1>
        <p className="subtitle">
          {!inviteId
            ? `Creating a ${APP_NAME} account requires a personal invite link from someone already on the team.`
            : invite?.used
            ? "This invite link has already been used. Ask for a new one."
            : "This invite link isn't valid. Ask for a new one."}
        </p>
        <p className="subtitle" style={{ marginTop: 16 }}>
          Already have an account? <a href="/login" style={{ color: "#c9a227" }}>Log in</a>
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 360, margin: "60px auto" }}>
      <h1>Create your {APP_NAME} account</h1>
      <p className="subtitle">
        {invite.inviterName ? `${invite.inviterName} invited` : "You've been invited"} you to join as{" "}
        <strong>{ROLE_LABELS[invite.role] || invite.role}</strong>.
      </p>
      {TEXTING_ENABLED && (
        <p className="subtitle">
          You'll set up your own Mailchimp texting number in the next step, billed to you directly.
        </p>
      )}
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input
          type="password"
          autoComplete="new-password"
          placeholder="Password (8+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          placeholder="Confirm your last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoComplete="off"
          required
        />
        <button type="submit" disabled={loading}>{loading ? "Creating account..." : "Create Account"}</button>
      </form>
      <p className="subtitle" style={{ marginTop: 16 }}>
        Already have an account? <a href="/login" style={{ color: "#c9a227" }}>Log in</a>
      </p>
    </div>
  );
}
