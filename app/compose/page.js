"use client";
import { useEffect, useState } from "react";

export default function ComposePage() {
  const [contacts, setContacts] = useState([]);
  const [filter, setFilter] = useState("all"); // all | lead | client
  const [selected, setSelected] = useState(new Set());
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((d) => setContacts(d.contacts || []));
  }, []);

  const visible = contacts.filter((c) => filter === "all" || c.type === filter);

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
          style={{ background: filter === "all" ? "#4f46e5" : "#ddd", color: filter === "all" ? "#fff" : "#333" }}
        >
          All
        </button>
        <button
          onClick={() => setFilter("lead")}
          style={{ background: filter === "lead" ? "#4f46e5" : "#ddd", color: filter === "lead" ? "#fff" : "#333" }}
        >
          Leads
        </button>
        <button
          onClick={() => setFilter("client")}
          style={{ background: filter === "client" ? "#4f46e5" : "#ddd", color: filter === "client" ? "#fff" : "#333" }}
        >
          Clients
        </button>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 8 }}>
          <strong>Recipients ({selected.size} selected total)</strong>
          <button type="button" onClick={toggleAll}>
            {visibleSelectedCount === visible.length && visible.length > 0 ? "Unselect Shown" : "Select Shown"}
          </button>
        </div>
        <div style={{ maxHeight: 240, overflowY: "auto" }}>
          {visible.map((c) => (
            <div className="checkbox-row" key={c.id}>
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={() => toggle(c.id)}
              />
              <span>{c.name} — {c.phone}</span>
            </div>
          ))}
          {visible.length === 0 && (
            <p className="subtitle">No contacts in this category yet.</p>
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
