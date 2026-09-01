"use client";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/formatDate";

function countAll(nodes) {
  return nodes.reduce((sum, n) => sum + 1 + countAll(n.children), 0);
}

function DownlineNode({ node, depth }) {
  return (
    <div style={{ marginLeft: depth * 20, marginTop: 8 }}>
      <div className="row" style={{ marginBottom: 0 }}>
        <span>
          {node.name}{" "}
          <span style={{ color: "#666", fontSize: 12, textTransform: "capitalize" }}>({node.role})</span>
        </span>
        <span style={{ color: "#666", fontSize: 12 }}>Joined {formatDate(node.created_at)}</span>
      </div>
      {node.children.map((child) => (
        <DownlineNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function TeamPage() {
  const [data, setData] = useState(null);
  const [inviteLink, setInviteLink] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/team/downline")
      .then((r) => r.json())
      .then(setData);
  }, []);

  useEffect(() => {
    if (data?.me?.id && typeof window !== "undefined") {
      setInviteLink(`${window.location.origin}/signup?ref=${data.me.id}`);
    }
  }, [data]);

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink);
    setMessage("Invite link copied.");
  }

  if (!data) return <p>Loading...</p>;

  const totalDownline = countAll(data.downline);

  return (
    <div>
      <h1>My Team</h1>
      <p className="subtitle">See who invited you, and everyone you've personally brought in.</p>

      {message && <p className="success">{message}</p>}

      <div className="card">
        <h3>Invite Downline</h3>
        <p className="subtitle" style={{ marginBottom: 8 }}>
          Share your personal link. Anyone who signs up through it is added to your downline.
        </p>
        <div className="row">
          <code style={{ fontSize: 13, wordBreak: "break-all" }}>{inviteLink}</code>
          <button onClick={copyLink} style={{ width: "auto", flexShrink: 0 }}>Invite Downline</button>
        </div>
      </div>

      <div className="card">
        <h3>Your Upline</h3>
        {data.upline ? (
          <p className="subtitle" style={{ marginBottom: 0 }}>
            You were invited by <strong style={{ color: "#f5f5f5" }}>{data.upline.name}</strong>{" "}
            <span style={{ textTransform: "capitalize" }}>({data.upline.role})</span>.
          </p>
        ) : (
          <p className="subtitle" style={{ marginBottom: 0 }}>
            You're at the top of your line - nobody is recorded as having invited you.
          </p>
        )}
      </div>

      <div className="card">
        <h3>Your Downline ({totalDownline})</h3>
        {data.downline.length === 0 ? (
          <p className="subtitle" style={{ marginBottom: 0 }}>
            Nobody yet. Share your invite link above to start building your downline.
          </p>
        ) : (
          data.downline.map((node) => <DownlineNode key={node.id} node={node} depth={0} />)
        )}
      </div>
    </div>
  );
}
