"use client";
import { useEffect, useState, useRef } from "react";
import { US_STATES } from "@/lib/usStates";
import { inferStateFromPhone } from "@/lib/areaCodeToState";
import UndoToast from "@/app/components/UndoToast";

const STALE_DAYS = 7;

// Days since last outbound text, or since they were added if never texted
// at all. Used to flag leads that are going cold.
function daysSinceContact(lead) {
  const from = lead.lastContactedAt || lead.created_at;
  if (!from) return null;
  return Math.floor((Date.now() - new Date(from).getTime()) / 86400000);
}

// Parses one line into { name, phone, state }. Handles tab-separated
// (Google Sheets copy), comma-separated (CSV), or just plain typed text
// separated by spaces - e.g. "Steve Stevens 3303456789 AZ". Finds the phone
// number by looking for a token with 7+ digits; everything before it is the
// name, and a state abbreviation found after it (if any) is captured too.
function parseLine(line) {
  let parts;
  if (line.includes("\t")) parts = line.split("\t");
  else if (line.includes(",")) parts = line.split(",");
  else parts = line.split(/\s+/);
  parts = parts.map((p) => p.trim()).filter((p) => p !== "");
  if (parts.length < 2) return null;

  let phoneIndex = -1;
  for (let i = parts.length - 1; i >= 0; i--) {
    const digits = parts[i].replace(/\D/g, "");
    if (digits.length >= 7) {
      phoneIndex = i;
      break;
    }
  }
  if (phoneIndex === -1) return null; // no phone-like token on this line - probably a header row

  const phone = parts[phoneIndex];
  const name = parts.slice(0, phoneIndex).join(" ");
  if (!name) return null;

  const afterPhone = parts.slice(phoneIndex + 1);
  const stateToken = afterPhone.find((p) => US_STATES.includes(p.toUpperCase()));

  return { name, phone, state: stateToken ? stateToken.toUpperCase() : null };
}

function parseRows(text) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map(parseLine)
    .filter(Boolean);
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("");
  const [bulk, setBulk] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [undo, setUndo] = useState(null); // { ids, text } - shown as a dismissable toast
  const fileInputRef = useRef(null);

  async function load() {
    const res = await fetch("/api/contacts?type=lead");
    const data = await res.json();
    setLeads(data.contacts || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function addOne(e) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, type: "lead", state: state || null }),
    });
    setLoading(false);
    if (res.ok) {
      setName("");
      setPhone("");
      setState("");
      setMessage("Lead added.");
      load();
    } else {
      const d = await res.json();
      setMessage(d.error || "Something went wrong.");
    }
  }

  async function submitRows(rows) {
    if (rows.length === 0) {
      setMessage("Couldn't find any valid name/phone rows.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: rows.map((r) => ({ ...r, type: "lead" })) }),
    });
    setLoading(false);
    if (res.ok) {
      setMessage(`Added ${rows.length} leads.`);
      load();
    } else {
      const d = await res.json();
      setMessage(d.error || "Something went wrong.");
    }
  }

  async function addBulk(e) {
    e.preventDefault();
    await submitRows(parseRows(bulk));
    setBulk("");
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    await submitRows(parseRows(text));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function removeLead(id, name) {
    if (!confirm("Remove this lead?")) return;
    await fetch("/api/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setUndo({ ids: [id], text: `Removed ${name}.` });
    load();
  }

  async function convertToClient(id) {
    await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type: "client" }),
    });
    setMessage("Moved to Clients. Fill in their full details on the Clients page.");
    load();
  }

  function toggleSelected(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleSelectAllVisible() {
    const visibleIds = visibleLeads.map((c) => c.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
    const next = new Set(selected);
    if (allSelected) {
      visibleIds.forEach((id) => next.delete(id));
    } else {
      visibleIds.forEach((id) => next.add(id));
    }
    setSelected(next);
  }

  async function removeSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`Remove ${ids.length} selected lead${ids.length === 1 ? "" : "s"}?`)) return;
    await fetch("/api/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setSelected(new Set());
    setUndo({ ids, text: `Removed ${ids.length} lead${ids.length === 1 ? "" : "s"}.` });
    load();
  }

  async function undoRemove() {
    if (!undo) return;
    await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: undo.ids, restore: true }),
    });
    setUndo(null);
    setMessage("Restored.");
    load();
  }

  async function convertSelectedToClients() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, type: "client" }),
    });
    setSelected(new Set());
    setMessage(`Moved ${ids.length} lead${ids.length === 1 ? "" : "s"} to Clients. Fill in their full details on the Clients page.`);
    load();
  }

  // Matches against the full name, just the first word, just the rest
  // (last name), or the phone number - so searching "Smith" or "555" both work.
  const visibleLeads = leads.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const parts = c.name.toLowerCase().split(/\s+/);
    const first = parts[0] || "";
    const last = parts.slice(1).join(" ");
    return (
      c.name.toLowerCase().includes(q) ||
      first.includes(q) ||
      last.includes(q) ||
      c.phone.includes(q)
    );
  });

  const staleLeads = leads.filter((l) => {
    const d = daysSinceContact(l);
    return d !== null && d >= STALE_DAYS;
  });

  return (
    <div>
      <h1>Leads</h1>
      <p className="subtitle">Add or remove leads, or bring in a whole lead pack at once.</p>

      {message && <p className="success">{message}</p>}

      {staleLeads.length > 0 && (
        <div className="card" style={{ background: "rgba(248, 113, 113, 0.06)", border: "1px solid rgba(248, 113, 113, 0.35)" }}>
          <div className="label-caps" style={{ color: "var(--danger)" }}>Going Cold</div>
          <p className="subtitle" style={{ marginTop: 4, marginBottom: 0 }}>
            {staleLeads.length} lead{staleLeads.length === 1 ? "" : "s"} haven't been texted in {STALE_DAYS}+ days
            — worth a follow-up before they go cold for good.
          </p>
        </div>
      )}

      <div className="card">
        <h3>Import a lead pack</h3>
        <p className="subtitle" style={{ marginBottom: 8 }}>
          Paste from Google Sheets (any columns, phone anywhere), or just type one lead per
          line yourself - name, phone, and optionally their state at the end.
        </p>
        <form onSubmit={addBulk}>
          <textarea
            rows={6}
            placeholder={"Type or paste one per line, e.g.\nSteve Stevens 3303456789 AZ\nJane Smith 555-123-4567"}
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
          />
          <button type="submit" disabled={loading}>{loading ? "Adding..." : "Add List"}</button>
        </form>
        <div style={{ marginTop: 12 }}>
          <label className="subtitle" style={{ display: "block", marginBottom: 6 }}>
            Or upload a CSV file:
          </label>
          <input type="file" accept=".csv,.txt" ref={fileInputRef} onChange={handleFileUpload} />
        </div>
        <p className="subtitle" style={{ marginTop: 10, marginBottom: 0 }}>
          No state typed in? It gets guessed from the area code automatically wherever you
          sort/filter by state.
        </p>
      </div>

      <div className="card">
        <h3>Add one lead</h3>
        <form onSubmit={addOne}>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <select value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">State (optional - guessed from area code if left blank)</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit" disabled={loading}>Add Lead</button>
        </form>
      </div>

      <h3>
        {visibleLeads.length === leads.length ? "All Leads" : "Showing"} ({visibleLeads.length}
        {visibleLeads.length !== leads.length ? ` of ${leads.length}` : ""})
      </h3>
      <input
        placeholder="Search by name (first or last) or phone number..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {visibleLeads.length > 0 && (
        <div className="row" style={{ marginBottom: 12 }}>
          <div className="checkbox-row" style={{ marginBottom: 0 }}>
            <input
              type="checkbox"
              checked={visibleLeads.length > 0 && visibleLeads.every((c) => selected.has(c.id))}
              onChange={toggleSelectAllVisible}
            />
            <span style={{ fontSize: 14 }}>
              {selected.size > 0 ? `${selected.size} selected` : "Select all shown"}
            </span>
          </div>
          {selected.size > 0 && (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={convertSelectedToClients} style={{ background: "#059669" }}>
                Move Selected to Clients
              </button>
              <button onClick={removeSelected} style={{ background: "#dc2626" }}>
                Remove Selected
              </button>
            </div>
          )}
        </div>
      )}

      {visibleLeads.map((c) => {
        const displayState = c.state || inferStateFromPhone(c.phone);
        const daysSince = daysSinceContact(c);
        const isStale = daysSince !== null && daysSince >= STALE_DAYS;
        return (
          <div className="card row" key={c.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={() => toggleSelected(c.id)}
              />
              <div>
                <strong>{c.name}</strong>{" "}
                {displayState && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 10,
                      border: `1px solid ${c.state ? "#c9a227" : "rgba(255,255,255,0.2)"}`,
                      color: c.state ? "#c9a227" : "#9a9a9a",
                    }}
                    title={c.state ? "Set manually" : "Guessed from area code"}
                  >
                    {displayState}
                  </span>
                )}{" "}
                {isStale && (
                  <span
                    className="badge"
                    style={{ color: "var(--danger)", borderColor: "var(--danger)", background: "rgba(248,113,113,0.08)" }}
                    title={c.lastContactedAt ? `Last texted ${daysSince} days ago` : `Added ${daysSince} days ago, never texted`}
                  >
                    {c.lastContactedAt ? `No contact ${daysSince}d` : `Never contacted (${daysSince}d)`}
                  </span>
                )}
                <div style={{ color: "#9a9a9a", fontSize: 14 }}>{c.phone}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => convertToClient(c.id)} style={{ background: "#059669" }}>
                Move to Clients
              </button>
              <button onClick={() => removeLead(c.id, c.name)} style={{ background: "#dc2626" }}>Remove</button>
            </div>
          </div>
        );
      })}
      {leads.length === 0 && <p className="subtitle">No leads yet.</p>}
      {leads.length > 0 && visibleLeads.length === 0 && (
        <p className="subtitle">No leads match your search.</p>
      )}
      <UndoToast text={undo?.text} onUndo={undoRemove} onDismiss={() => setUndo(null)} />
    </div>
  );
}
