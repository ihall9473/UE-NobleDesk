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
  const [suggestions, setSuggestions] = useState(null);

  const isAdmin = myRole === "admin";

  async function load() {
    const res = await fetch("/api/admin/team");
    if (res.status === 403) {
      setTeam("forbidden");
      return;
    }
    const data = await res.json();
    setTeam(data.team || []);
    setMyRole(data.myRole);
    setInviteCode(data.inviteCode || "");
  }

  async function loadSuggestions() {
    const res = await fetch("/api/suggestions");
    if (!res.ok) return;
    const data = await res.json();
    setSuggestions(data.suggestions || []);
  }

  useEffect(() => {
    load();
    loadSuggestions();
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

  return (
    <div>
      <h1>Team Admin</h1>
      <p className="subtitle">Invite coworkers and track how everyone's using the app.</p>

      {message && <p className="success">{message}</p>}

      {suggestions && suggestions.length > 0 && (
        <div className="card">
          <h3>Suggestions ({suggestions.length})</h3>
          <p className="subtitle" style={{ marginBottom: 8 }}>
            Sent from the 💡 button in the corner of the app.
          </p>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {suggestions.map((s) => (
              <div key={s.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 14 }}>{s.message}</div>
                <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                  {s.profiles?.name || "Someone"} · {new Date(s.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
