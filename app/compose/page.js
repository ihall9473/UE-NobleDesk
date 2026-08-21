"use client";
import { useEffect, useState } from "react";
import { inferStateFromPhone } from "@/lib/areaCodeToState";

function stateOf(contact) {
  return contact.state || inferStateFromPhone(contact.phone) || "Unknown";
}

export default function ComposePage() {
  const [contacts, setContacts] = useState([]);
  const [filter, setFilter] = useState("all"); // all | lead | client
  const [stateFilter, setStateFilter] = useState("all");
  const [sortByState, setSortByState] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((d) => setContacts(d.contacts || []));
  }, []);

  const stateOptions = [...new Set(contacts.map(stateOf))].sort();

  let visible = contacts.filter((c) => {
    const matchesTypeState =
      (filter === "all" || c.type === filter) && (stateFilter === "all" || stateOf(c) === stateFilter);
    if (!matchesTypeState) return false;

    const q = search.trim().toLowerCase();
    if (!q) return true;
    const parts = c.name.toLowerCase().split(/\s+/);
    const first = parts[0] || "";
    const last = parts.slice(1).join(" ");
    return c.name.toLowerCase().includes(q) || first.includes(q) || last.includes(q) || c.phone.includes(q);
  });

  if (sortByState) {
    visible = [...visible].sort((a, b) => stateOf(a).localeCompare(stateOf(b)));
  }

  function toggle(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleAll() {
    const visibleIds = visible.map((c) => c.id);
    const allVisibleSelected = visibleIds.every((id) => selected.has(id));
    const next = new Set(selected);
    if (allVisibleSelected) {
      visibleIds.forEach((id) => next.delete(id));
    } else {
      visibleIds.forEach((id) => next.add(id));
    }
    setSelected(next);
  }

  async function send(e) {
    e.preventDefault();
    setSending(true);
    setResult(null);
    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactIds: Array.from(selected), message }),
    });
    const data = await res.json();
    setSending(false);
    if (res.ok) {
      const failed = data.results.filter((r) => !r.ok);
      setResult(
        failed.length === 0
          ? `Sent to ${data.results.length} people successfully.`
          : `Sent to ${data.results.length - failed.length}, but ${failed.length} failed.`
      );
      setMessage("");
      setSelected(new Set());
    } else {
      setResult(data.error || "Something went wrong.");
    }
  }

  const visibleSelectedCount = visible.filter((c) => selected.has(c.id)).length;

  // Group into sections by state when sorting by state, so it's easy to
  // scan and select a whole state at once.
  let groups = null;
  if (sortByState) {
    groups = [];
    let lastState = null;
    for (const c of visible) {
      const s = stateOf(c);
      if (s !== lastState) {
        groups.push({ state: s, contacts: [] });
        lastState = s;
      }
      groups[groups.length - 1].contacts.push(c);
    }
  }

  return (
    <div>
      <h1>Send a Text</h1>
      <p className="subtitle">
        Each person picked below gets their own individual text — never a group thread.
      </p>

      {result && <p className="success">{result}</p>}

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setFilter("all")}
          style={{ background: filter === "all" ? "#c9a227" : "#232323", color: filter === "all" ? "#0e0e0f" : "#9a9a9a" }}
        >
          All
        </button>
        <button
          onClick={() => setFilter("lead")}
          style={{ background: filter === "lead" ? "#c9a227" : "#232323", color: filter === "lead" ? "#0e0e0f" : "#9a9a9a" }}
        >
          Leads
        </button>
        <button
          onClick={() => setFilter("client")}
          style={{ background: filter === "client" ? "#c9a227" : "#232323", color: filter === "client" ? "#0e0e0f" : "#9a9a9a" }}
        >
          Clients
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} style={{ marginBottom: 0, width: "auto", flex: 1 }}>
          <option value="all">All States</option>
          {stateOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="checkbox-row" style={{ marginBottom: 0 }}>
          <input type="checkbox" checked={sortByState} onChange={(e) => setSortByState(e.target.checked)} />
          <span style={{ fontSize: 14 }}>Sort/group by state</span>
        </div>
      </div>
      <p className="subtitle" style={{ marginTop: -6 }}>
        State is whatever was set manually, or guessed from the area code when it wasn't.
      </p>

      <input
        placeholder="Search by name or phone number to find someone quickly..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card">
        <div className="row" style={{ marginBottom: 8 }}>
          <strong>Recipients ({selected.size} selected total)</strong>
          <button type="button" onClick={toggleAll}>
            {visibleSelectedCount === visible.length && visible.length > 0 ? "Unselect Shown" : "Select Shown"}
          </button>
        </div>
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {sortByState && groups
            ? groups.map((g) => (
                <div key={g.state} style={{ marginBottom: 10 }}>
                  <div className="label-caps" style={{ marginBottom: 4 }}>{g.state} ({g.contacts.length})</div>
                  {g.contacts.map((c) => (
                    <div className="checkbox-row" key={c.id}>
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
                      <span>{c.name} — {c.phone}</span>
                    </div>
                  ))}
                </div>
              ))
            : visible.map((c) => (
                <div className="checkbox-row" key={c.id}>
                  <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
                  <span>{c.name} — {c.phone}</span>
                </div>
              ))}
          {visible.length === 0 && (
            <p className="subtitle">
              {search ? "No contacts match your search." : "No contacts in this category yet."}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={send}>
        <textarea
          rows={5}
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <button type="submit" disabled={sending || selected.size === 0}>
          {sending ? "Sending..." : `Send to ${selected.size} people`}
        </button>
      </form>
    </div>
  );
}
