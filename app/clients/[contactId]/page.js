"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PolicyForm from "@/app/components/PolicyForm";
import ActivityAndTasks from "@/app/components/ActivityAndTasks";
import { US_STATES } from "@/lib/usStates";

export default function ClientDetailPage() {
  const { contactId } = useParams();
  const [contact, setContact] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactState, setContactState] = useState("");
  const [message, setMessage] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const [addingPolicy, setAddingPolicy] = useState(false);

  async function load() {
    const res = await fetch(`/api/clients/${contactId}`);
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Couldn't load this client.");
      return;
    }
    setContact(data.contact);
    setName(data.contact.name || "");
    setPhone(data.contact.phone || "");
    setContactState(data.contact.state || "");
  }

  useEffect(() => {
    load();
  }, [contactId]);

  async function saveContact(e) {
    e.preventDefault();
    setSavingContact(true);
    const res = await fetch(`/api/clients/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, contactState }),
    });
    setSavingContact(false);
    const data = await res.json();
    if (res.ok) {
      setMessage("Saved.");
      load();
    } else {
      setMessage(data.error || "Something went wrong.");
    }
  }

  async function addPolicy() {
    setAddingPolicy(true);
    await fetch(`/api/clients/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPolicy: true, applicationSubmittedDate: new Date().toISOString().slice(0, 10) }),
    });
    setAddingPolicy(false);
    load();
  }

  async function removeClient() {
    if (!confirm(`Remove ${name}?`)) return;
    await fetch(`/api/clients/${contactId}`, { method: "DELETE" });
    window.location.href = `/clients?undoId=${contactId}&undoName=${encodeURIComponent(name)}`;
  }

  if (!contact) return <p>{message || "Loading..."}</p>;

  const policies = contact.policies || [];

  return (
    <div>
      <div className="row" style={{ marginBottom: 0 }}>
        <a href="/clients" style={{ color: "#c9a227" }}>&larr; Back to Clients</a>
        <a href="/quoter" target="_blank" rel="noopener noreferrer">
          <button type="button" style={{ width: "auto", marginBottom: 0 }}>Open Quoter</button>
        </a>
      </div>
      <h1>{contact.name}</h1>
      {message && <p className={message === "Saved." ? "success" : "error"}>{message}</p>}

      <ActivityAndTasks contactId={contactId} />

      <div className="card">
        <h3>Contact Info</h3>
        <form onSubmit={saveContact}>
          <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" required />
          <input placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="off" required />

          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>State</label>
          <select value={contactState} onChange={(e) => setContactState(e.target.value)}>
            <option value="">Select state...</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit" disabled={savingContact}>{savingContact ? "Saving..." : "Save Contact Info"}</button>
        </form>
      </div>

      <div className="row" style={{ marginBottom: 0 }}>
        <h3 style={{ marginBottom: 0 }}>
          {policies.length} Polic{policies.length === 1 ? "y" : "ies"}
        </h3>
        <button type="button" onClick={addPolicy} disabled={addingPolicy} style={{ width: "auto", marginBottom: 0 }}>
          {addingPolicy ? "Adding..." : "+ Add Another Policy"}
        </button>
      </div>
      <p className="subtitle">
        A client can have more than one policy on file - a rewrite, an add-on, or one that was
        cancelled and replaced. Each policy keeps its own full details below.
      </p>

      {policies.length === 0 && <p className="subtitle">No policies yet - add one above.</p>}
      {policies.map((p) => (
        <PolicyForm
          key={p.id}
          contactId={contactId}
          policy={p}
          defaultOpen={policies.length === 1}
          onSaved={load}
          onDeleted={load}
        />
      ))}

      <div style={{ marginBottom: 40 }}>
        <button type="button" onClick={removeClient} style={{ background: "#dc2626" }}>Delete Client</button>
      </div>
    </div>
  );
}
