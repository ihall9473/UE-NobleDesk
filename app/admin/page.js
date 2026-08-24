"use client";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [team, setTeam] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("agent");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [accessCode, setAccessCode] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState("");

  const isAdmin = myRole === "admin";

  async function load() {
    const res = await fetch("/api/admin/team");
    if (res.status === 401) {
      setTeam("locked");
      return;
    }
    if (res.status === 403) {
      setTeam("forbidden");
      return;
    }
    const data = await res.json();
    setTeam(data.team || []);
    setMyRole(data.myRole);
    setInviteCode(data.inviteCode || "");
  }

  async function unlock(e) {
    e.preventDefault();
    setUnlocking(true);
    setUnlockError("");
    const res = await fetch("/api/admin/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: accessCode }),
    });
    setUnlocking(false);
    if (res.ok) {
      setAccessCode("");
      setTeam(null);
      load();
    } else {
      const data = await res.json();
      setUnlockError(data.error || "Something went wrong.");
    }
  }

  useEffect(() => {
    load();
    if (typeof window !== "undefined") {
      setInviteLink(`${window.location.origin}/signup`);
    }
  }, []);

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink);
    setMessage("Invite link copied. Send it along with your invite code.");
  }

  async function addCoworker(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role }),
    });
    setLoading(false);
    const data = await res.json();
    if (res.ok) {
      setMessage(`Invited ${name} directly by email.`);
      setName("");
      setEmail("");
      setRole("agent");
      load();
    } else {
      setMessage(data.error || "Something went wrong.");
    }
  }

  async function updateRole(userId, newRole) {
    const res = await fetch("/api/admin/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    const data = await res.json();
    if (!res.ok) setMessage(data.error);
    load();
  }

  if (team === "forbidden") {
    return <p>This page is for admins and managers only.</p>;
  }

  if (team === "locked") {
    return (
      <div>
        <h1>Team Admin</h1>
        <p className="subtitle">Enter the manager code to unlock this page.</p>
        <div className="card" style={{ maxWidth: 360 }}>
          <form onSubmit={unlock}>
            {unlockError && <p className="error">{unlockError}</p>}
            <input
              type="password"
              placeholder="Manager code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              autoFocus
              required
            />
            <button type="submit" disabled={unlocking}>{unlocking ? "Checking..." : "Unlock"}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Team Admin</h1>
      <p className="subtitle">Invite coworkers and track how everyone's using the app.</p>

      {message && <p className="success">{message}</p>}

      <div className="card">
        <h3>Invite link (self-serve)</h3>
        <p className="subtitle" style={{ marginBottom: 8 }}>
          Send this link plus your invite code to coworkers. They create their own login and
          connect their own Twilio account and number — nothing for you to set up per person.
        </p>
        <div className="row">
          <code style={{ fontSize: 13 }}>{inviteLink}</code>
          <button onClick={copyLink}>Copy Link</button>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <label className="subtitle" style={{ marginRight: 8 }}>Invite code:</label>
          <code style={{ fontSize: 13 }}>{inviteCode}</code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(inviteCode);
              setMessage("Invite code copied.");
            }}
          >
            Copy Code
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Or invite directly by email</h3>
        <form onSubmit={addCoworker}>
          <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input type="email" placeholder="Work email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {isAdmin ? (
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="agent">Agent</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          ) : (
            <p className="subtitle">New coworkers are added as Agents.</p>
          )}
          <button type="submit" disabled={loading}>{loading ? "Inviting..." : "Send Email Invite"}</button>
        </form>
      </div>

      <h3>Team ({team ? team.length : 0})</h3>
      {team === null && <p>Loading...</p>}
      {team && team.map((member) => (
        <div className="card" key={member.id}>
          <div className="row">
            <strong>{member.name}</strong>
            {isAdmin ? (
              <select
                value={member.role}
                onChange={(e) => updateRole(member.id, e.target.value)}
                style={{ width: "auto", marginBottom: 0 }}
              >
                <option value="agent">Agent</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            ) : (
              <span style={{ color: "#666", fontSize: 14, textTransform: "capitalize" }}>{member.role}</span>
            )}
          </div>
          <div style={{ color: "#666", fontSize: 13, marginTop: 6 }}>
            {member.twilio_number ? (
              <span>Number: {member.twilio_number}</span>
            ) : (
              <span style={{ color: "#b45309" }}>No number set up yet</span>
            )}
          </div>
          <div style={{ color: "#666", fontSize: 13, marginTop: 2 }}>
            {member.contactCount} contact{member.contactCount === 1 ? "" : "s"} ·{" "}
            {member.messageCount} message{member.messageCount === 1 ? "" : "s"} ·{" "}
            {member.responseRate === null ? "no texts sent yet" : `${member.responseRate}% response rate`}
          </div>
        </div>
      ))}
    </div>
  );
}
