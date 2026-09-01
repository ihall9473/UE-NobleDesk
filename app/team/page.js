"use client";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/formatDate";
import { formatCurrency } from "@/lib/formatCurrency";

function countAll(nodes) {
  return nodes.reduce((sum, n) => sum + 1 + countAll(n.children), 0);
}

function ProductionStats({ production, payoutLabel }) {
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{production.familiesProtected}</div>
        <div className="subtitle" style={{ marginBottom: 0 }}>Families Protected</div>
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(production.submittedBusiness)}</div>
        <div className="subtitle" style={{ marginBottom: 0 }}>Submitted Business</div>
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{formatCurrency(production.totalMonthlyPremium)}</div>
        <div className="subtitle" style={{ marginBottom: 0 }}>Total Monthly Premium</div>
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "var(--gold)" }}>
          {formatCurrency(production.expectedPayout)}
        </div>
        <div className="subtitle" style={{ marginBottom: 0 }}>{payoutLabel}</div>
      </div>
    </div>
  );
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
  const [loadError, setLoadError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/team/downline")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setLoadError(d.error);
        else setData(d);
      })
      .catch(() => setLoadError("Something went wrong loading your team."));
  }, []);

  useEffect(() => {
    if (data?.me?.id && typeof window !== "undefined") {
      setInviteLink(
        `${window.location.origin}/signup?ref=${data.me.id}&code=${encodeURIComponent(data.inviteCode || "")}`
      );
    }
  }, [data]);

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink);
    setMessage("Invite link copied.");
    fetch("/api/team/status", { method: "POST" }).catch(() => {});
  }

  if (loadError) return <p className="error">{loadError}</p>;
  if (!data) return <p>Loading...</p>;

  const totalDownline = countAll(data.downline);

  return (
    <div>
      <h1>My Team</h1>
      <p className="subtitle">See who invited you, and everyone you've personally brought in.</p>

      {message && <p className="success">{message}</p>}

      <div className="card">
        <h3>Your Production</h3>
        <ProductionStats production={data.myProduction} payoutLabel="Expected Payout" />
        <p className="subtitle" style={{ marginTop: 12, marginBottom: 0 }}>
          Expected Payout uses your comp % for each carrier, set on the{" "}
          <a href="/carriers">Carriers</a> page.
        </p>
      </div>

      <div className="card">
        <h3>Invite Downline</h3>
        <p className="subtitle" style={{ marginBottom: 8 }}>
          Share your personal link - it already includes the invite code, so whoever signs up
          through it is added straight to your downline.
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
        <h3>Your Downline's Production</h3>
        <ProductionStats production={data.downlineProduction} payoutLabel="Downline's Expected Payout" />
        <p className="subtitle" style={{ marginTop: 12, marginBottom: 0 }}>
          Each person's own comp % is used for their own policies - this is what's expected to be
          paid to them individually, not to you.
        </p>
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
