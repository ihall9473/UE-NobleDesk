"use client";
import { useEffect, useMemo, useState } from "react";
import { formatDate } from "@/lib/formatDate";
import { formatCurrency } from "@/lib/formatCurrency";
import { DATE_PRESETS, getDateRange } from "@/lib/dateRanges";

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
          {formatCurrency(production.pendingPayout)}
        </div>
        <div className="subtitle" style={{ marginBottom: 0 }}>Pending {payoutLabel}</div>
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>
          {formatCurrency(production.paidPayout)}
        </div>
        <div className="subtitle" style={{ marginBottom: 0 }}>Paid {payoutLabel}</div>
      </div>
    </div>
  );
}

const LEADERBOARD_COLUMNS = [
  { key: "name", label: "Name", numeric: false },
  { key: "role", label: "Role", numeric: false },
  { key: "familiesProtected", label: "Total Deals", numeric: true },
  { key: "submittedBusiness", label: "Submitted Business", numeric: true, money: true },
  { key: "totalMonthlyPremium", label: "Monthly Premium", numeric: true, money: true },
];

function Leaderboard({ people, meId }) {
  const [sortKey, setSortKey] = useState("submittedBusiness");
  const [sortDir, setSortDir] = useState("desc");

  function toggleSort(key) {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir(LEADERBOARD_COLUMNS.find((c) => c.key === key)?.numeric ? "desc" : "asc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...people];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
      return sortDir === "desc" ? -cmp : cmp;
    });
    return copy;
  }, [people, sortKey, sortDir]);

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            {LEADERBOARD_COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                style={{
                  textAlign: col.numeric ? "right" : "left",
                  padding: "6px 10px",
                  cursor: "pointer",
                  color: "#9a9a9a",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  whiteSpace: "nowrap",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {col.label}{sortKey === col.key ? (sortDir === "desc" ? " ↓" : " ↑") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr
              key={p.id}
              style={{
                background: p.id === meId ? "rgba(201, 162, 39, 0.08)" : "transparent",
              }}
            >
              <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>
                {p.name}
                {p.email && (
                  <div style={{ color: "#666", fontSize: 12 }}>{p.email}</div>
                )}
              </td>
              <td style={{ padding: "6px 10px", textTransform: "capitalize", color: "#9a9a9a" }}>{p.role}</td>
              <td style={{ padding: "6px 10px", textAlign: "right" }}>{p.familiesProtected}</td>
              <td style={{ padding: "6px 10px", textAlign: "right" }}>{formatCurrency(p.submittedBusiness)}</td>
              <td style={{ padding: "6px 10px", textAlign: "right" }}>{formatCurrency(p.totalMonthlyPremium)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HierarchyNode({ node, depth, meId }) {
  const isMe = node.id === meId;
  return (
    <div style={{ marginLeft: depth * 22, marginTop: 8 }}>
      <div
        style={{
          padding: "8px 10px",
          borderRadius: 8,
          background: isMe ? "rgba(201, 162, 39, 0.1)" : "rgba(255,255,255,0.03)",
          border: isMe ? "1px solid rgba(201, 162, 39, 0.4)" : "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="row" style={{ marginBottom: 0 }}>
          <span>
            <strong>{node.name}</strong>{isMe ? " (you)" : ""}{" "}
            <span style={{ color: "#666", fontSize: 12, textTransform: "capitalize" }}>({node.role})</span>
            {node.email && (
              <span style={{ color: "#666", fontSize: 12, marginLeft: 8 }}>{node.email}</span>
            )}
          </span>
          <span style={{ color: "#666", fontSize: 12 }}>Joined {formatDate(node.created_at)}</span>
        </div>
        <div style={{ color: "#9a9a9a", fontSize: 13, marginTop: 4 }}>
          {node.familiesProtected} protected · {formatCurrency(node.submittedBusiness)} submitted ·{" "}
          {formatCurrency(node.totalMonthlyPremium)}/mo · {formatCurrency(node.pendingPayout)} pending ·{" "}
          {formatCurrency(node.paidPayout)} paid
        </div>
      </div>
      {node.children.map((child) => (
        <HierarchyNode key={child.id} node={child} depth={depth + 1} meId={meId} />
      ))}
    </div>
  );
}

export default function TeamPage() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [message, setMessage] = useState("");
  const [treeScope, setTreeScope] = useState("oneLevelUp"); // oneLevelUp | company
  const [datePreset, setDatePreset] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    const range = getDateRange(datePreset, customDate, customStart, customEnd);
    const params = new URLSearchParams();
    if (range) {
      params.set("start", range.start);
      params.set("end", range.end);
    }
    const qs = params.toString();
    fetch(`/api/team/downline${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setLoadError(d.error);
        else setData(d);
      })
      .catch(() => setLoadError("Something went wrong loading your team."));
  }, [datePreset, customDate, customStart, customEnd]);

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

  const hierarchyRoots = useMemo(() => {
    if (!data) return [];
    const byId = Object.fromEntries(data.people.map((p) => [p.id, p]));
    const childrenOf = {};
    for (const p of data.people) {
      if (p.invited_by && byId[p.invited_by]) (childrenOf[p.invited_by] ||= []).push(p);
    }
    function buildTree(id) {
      return (childrenOf[id] || [])
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map((p) => ({ ...p, children: buildTree(p.id) }));
    }

    if (treeScope === "company") {
      return data.people
        .filter((p) => !p.invited_by || !byId[p.invited_by])
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map((p) => ({ ...p, children: buildTree(p.id) }));
    }

    // One level up: root at my upline (or myself, if I have none).
    const rootId = data.upline?.id || data.me.id;
    const root = byId[rootId];
    return root ? [{ ...root, children: buildTree(rootId) }] : [];
  }, [data, treeScope]);

  if (loadError) return <p className="error">{loadError}</p>;
  if (!data) return <p>Loading...</p>;

  const totalDownline = countAll(data.downline);

  return (
    <div>
      <h1>My Team</h1>
      <p className="subtitle">See who invited you, everyone you've personally brought in, and how the whole team is doing.</p>

      {message && <p className="success">{message}</p>}

      <div className="card">
        <h3>Your Production</h3>
        <ProductionStats production={data.myProduction} payoutLabel="Payout" />
        <p className="subtitle" style={{ marginTop: 12, marginBottom: 0 }}>
          Payout uses your comp % for each carrier (set on the <a href="/carriers">Carriers</a>{" "}
          page) and each policy's Commission Status.
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
        <ProductionStats production={data.downlineProduction} payoutLabel="Downline Payout" />
        <p className="subtitle" style={{ marginTop: 12, marginBottom: 0 }}>
          Each person's own comp % is used for their own policies - this is what's expected to be
          paid to them individually, not to you.
        </p>
      </div>

      <div className="card">
        <h3>Team Leaderboard ({data.people.length})</h3>
        <p className="subtitle" style={{ marginBottom: 8 }}>
          Everyone in the company, ranked by whatever column you click. Your row is highlighted.
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>
              Date Range
            </label>
            <select value={datePreset} onChange={(e) => setDatePreset(e.target.value)} style={{ marginBottom: 0 }}>
              {DATE_PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {datePreset === "customDate" && (
          <div style={{ marginBottom: 10 }}>
            <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Date</label>
            <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} style={{ marginBottom: 0 }} />
          </div>
        )}

        {datePreset === "customRange" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>From</label>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={{ marginBottom: 0 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>To</label>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={{ marginBottom: 0 }} />
            </div>
          </div>
        )}

        <Leaderboard people={data.leaderboardPeople} meId={data.me.id} />
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Team Hierarchy</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setTreeScope("oneLevelUp")}
              style={{
                width: "auto",
                marginBottom: 0,
                background: treeScope === "oneLevelUp" ? "#c9a227" : "#232323",
                color: treeScope === "oneLevelUp" ? "#0e0e0f" : "#9a9a9a",
              }}
            >
              One Level Up
            </button>
            <button
              type="button"
              onClick={() => setTreeScope("company")}
              style={{
                width: "auto",
                marginBottom: 0,
                background: treeScope === "company" ? "#c9a227" : "#232323",
                color: treeScope === "company" ? "#0e0e0f" : "#9a9a9a",
              }}
            >
              Whole Company
            </button>
          </div>
        </div>
        <p className="subtitle" style={{ marginBottom: 8 }}>
          {treeScope === "oneLevelUp"
            ? "Your upline, everyone else who shares that upline, and their downlines."
            : "The full company org chart, from the top down."}
        </p>
        {hierarchyRoots.length === 0 ? (
          <p className="subtitle" style={{ marginBottom: 0 }}>Nobody to show yet.</p>
        ) : (
          hierarchyRoots.map((node) => (
            <HierarchyNode key={node.id} node={node} depth={0} meId={data.me.id} />
          ))
        )}
      </div>
    </div>
  );
}
