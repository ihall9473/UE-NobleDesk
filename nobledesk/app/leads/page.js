"use client";
import { useEffect, useState, useRef } from "react";

// Splits pasted text into name/phone rows. Handles tab-separated (Google
// Sheets copy) or comma-separated (CSV), 2+ columns, skips a header row.
function parseRows(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows = lines
    .map((line) => {
      const parts = line.includes("\t") ? line.split("\t") : line.split(",");
      return parts.map((p) => p.trim()).filter((p) => p !== "");
    })
    .filter((parts) => parts.length >= 2)
    .map((parts) => {
      const phone = parts[parts.length - 1];
      const name = parts.slice(0, -1).join(" ");
      return { name, phone };
    });
  if (rows.length > 0 && !/\d/.test(rows[0].phone)) rows.shift();
  return rows.filter((r) => r.name && r.phone);
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bulk, setBulk] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
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
      body: JSON.stringify({ name, phone, type: "lead" }),
    });
    setLoading(false);
    if (res.ok) {
      setName("");
      setPhone("");
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

  async function removeLead(id) {
    if (!confirm("Remove this lead?")) return;
    await fetch("/api/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
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

  return (
    <div>
      <h1>Leads</h1>
      <p className="subtitle">Add or remove leads, or bring in a whole lead pack at once.</p>

      {message && <p className="success">{message}</p>}

      <div className="card">
        <h3>Import a lead pack</h3>
        <p className="subtitle" style={{ marginBottom: 8 }}>
          From Google Sheets: select the relevant columns (First Name, Last Name, Phone all
          work fine), copy, and paste below. Or upload a CSV.
        </p>
        <form onSubmit={addBulk}>
          <textarea
            rows={6}
            placeholder={"Paste directly from Google Sheets here, e.g.\nJane    Smith    555-123-4567\nJohn    Doe    555-987-6543"}
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
      </div>

      <div className="card">
        <h3>Add one lead</h3>
        <form onSubmit={addOne}>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <button type="submit" disabled={loading}>Add Lead</button>
        </form>
      </div>

      <h3>All Leads ({leads.length})</h3>
      {leads.map((c) => (
        <div className="card row" key={c.id}>
          <div>
            <strong>{c.name}</strong>
            <div style={{ color: "#666", fontSize: 14 }}>{c.phone}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => convertToClient(c.id)} style={{ background: "#059669" }}>
              Move to Clients
            </button>
            <button onClick={() => removeLead(c.id)} style={{ background: "#dc2626" }}>Remove</button>
          </div>
        </div>
      ))}
      {leads.length === 0 && <p className="subtitle">No leads yet.</p>}
    </div>
  );
}
