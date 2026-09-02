"use client";
import { useEffect, useState } from "react";
import { TEXTING_ENABLED } from "@/lib/features";
import FeatureDisabled from "@/app/components/FeatureDisabled";

export default function DripCampaignsPage() {
  if (!TEXTING_ENABLED) return <FeatureDisabled />;
  return <DripCampaignsPageInner />;
}

function DripCampaignsPageInner() {
  const [sequences, setSequences] = useState(null);
  const [enrollments, setEnrollments] = useState(null);
  const [leads, setLeads] = useState([]);
  const [name, setName] = useState("");
  const [steps, setSteps] = useState([{ delayDays: 0, message: "" }]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [enrollSequenceId, setEnrollSequenceId] = useState("");
  const [selectedLeads, setSelectedLeads] = useState(new Set());

  async function load() {
    const [seqRes, enrollRes, leadsRes] = await Promise.all([
      fetch("/api/drip-sequences").then((r) => r.json()),
      fetch("/api/drip-enrollments").then((r) => r.json()),
      fetch("/api/contacts?type=lead").then((r) => r.json()),
    ]);
    setSequences(seqRes.sequences || []);
    setEnrollments(enrollRes.enrollments || []);
    setLeads(leadsRes.contacts || []);
  }

  useEffect(() => {
    load();
  }, []);

  function updateStep(i, field, value) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }

  function addStep() {
    setSteps((prev) => [...prev, { delayDays: 3, message: "" }]);
  }

  function removeStep(i) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function createSequence(e) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/drip-sequences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, steps }),
    });
    setSaving(false);
    if (res.ok) {
      setName("");
      setSteps([{ delayDays: 0, message: "" }]);
      setShowForm(false);
      load();
    } else {
      const d = await res.json();
      setMessage(d.error || "Something went wrong.");
    }
  }

  async function removeSequence(id) {
    if (!confirm("Delete this sequence? Anyone currently enrolled will stop receiving it.")) return;
    await fetch("/api/drip-sequences", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  function toggleLead(id) {
    const next = new Set(selectedLeads);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeads(next);
  }

  async function enrollSelected() {
    if (!enrollSequenceId || selectedLeads.size === 0) return;
    const res = await fetch("/api/drip-enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sequenceId: enrollSequenceId, contactIds: Array.from(selectedLeads) }),
    });
    if (res.ok) {
      setMessage(`Enrolled ${selectedLeads.size} lead${selectedLeads.size === 1 ? "" : "s"}.`);
      setSelectedLeads(new Set());
      load();
    } else {
      const d = await res.json();
      setMessage(d.error || "Something went wrong.");
    }
  }

  async function unenroll(id) {
    await fetch("/api/drip-enrollments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  if (sequences === null) return <p>Loading...</p>;

  const activeEnrollments = (enrollments || []).filter((e) => e.active);

  return (
    <div>
      <h1>Drip Campaigns</h1>
      <p className="subtitle">
        Automated text sequences for nurturing cold leads. Checked once a day, same quiet-hours rules as Occasions.
      </p>
      {message && <p className="success">{message}</p>}

      <h3>Sequences</h3>
      {sequences.map((seq) => (
        <div className="card" key={seq.id}>
          <div className="row">
            <strong>{seq.name}</strong>
            <button onClick={() => removeSequence(seq.id)} style={{ background: "#dc2626", width: "auto" }}>Delete</button>
          </div>
          <div style={{ marginTop: 8 }}>
            {seq.steps.map((s, i) => (
              <div key={i} style={{ fontSize: 13, color: "#9a9a9a", marginBottom: 4 }}>
                Step {i + 1} ({s.delayDays === 0 ? "immediately" : `+${s.delayDays}d`}): {s.message}
              </div>
            ))}
          </div>
        </div>
      ))}
      {sequences.length === 0 && <p className="subtitle">No sequences yet.</p>}

      <button onClick={() => setShowForm(!showForm)} style={{ marginTop: 8 }}>
        {showForm ? "Cancel" : "+ New Sequence"}
      </button>

      {showForm && (
        <form onSubmit={createSequence} className="card" style={{ marginTop: 12 }}>
          <input placeholder="Sequence name (e.g. Cold Lead Nurture)" value={name} onChange={(e) => setName(e.target.value)} required />
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <input
                type="number"
                min="0"
                value={s.delayDays}
                onChange={(e) => updateStep(i, "delayDays", Number(e.target.value))}
                style={{ width: 90, marginBottom: 0 }}
                title="Days after the previous step"
              />
              <textarea
                rows={2}
                placeholder={i === 0 ? "Message sent immediately on enrollment..." : `Message sent ${s.delayDays} days later...`}
                value={s.message}
                onChange={(e) => updateStep(i, "message", e.target.value)}
                style={{ flex: 1, marginBottom: 0 }}
              />
              {steps.length > 1 && (
                <button type="button" onClick={() => removeStep(i)} style={{ width: "auto", marginBottom: 0, background: "#dc2626" }}>
                  &times;
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addStep} style={{ marginBottom: 10 }}>+ Add Step</button>
          <button type="submit" disabled={saving}>{saving ? "Saving..." : "Create Sequence"}</button>
        </form>
      )}

      <h3 style={{ marginTop: 32 }}>Enroll Leads</h3>
      <p className="subtitle">Great for leads that have gone cold - see the "Going Cold" flag on the Leads page.</p>
      <div className="row" style={{ marginBottom: 12 }}>
        <select value={enrollSequenceId} onChange={(e) => setEnrollSequenceId(e.target.value)} style={{ marginBottom: 0 }}>
          <option value="">Choose a sequence...</option>
          {sequences.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button type="button" onClick={enrollSelected} disabled={!enrollSequenceId || selectedLeads.size === 0} style={{ width: "auto" }}>
          Enroll {selectedLeads.size > 0 ? `(${selectedLeads.size})` : ""}
        </button>
      </div>
      {leads.map((lead) => (
        <div className="checkbox-row" key={lead.id}>
          <input type="checkbox" checked={selectedLeads.has(lead.id)} onChange={() => toggleLead(lead.id)} />
          <span style={{ fontSize: 14 }}>{lead.name} <span style={{ color: "#9a9a9a" }}>({lead.phone})</span></span>
        </div>
      ))}
      {leads.length === 0 && <p className="subtitle">No leads to enroll.</p>}

      <h3 style={{ marginTop: 32 }}>Currently Enrolled ({activeEnrollments.length})</h3>
      {activeEnrollments.map((e) => (
        <div className="card row" key={e.id}>
          <div>
            <strong>{e.contacts?.name}</strong>{" "}
            <span style={{ color: "#9a9a9a", fontSize: 13 }}>
              — {e.drip_sequences?.name}, step {e.current_step + 1} of {e.drip_sequences?.steps?.length}, next {e.next_send_date}
            </span>
          </div>
          <button onClick={() => unenroll(e.id)} style={{ background: "#dc2626", width: "auto" }}>Unenroll</button>
        </div>
      ))}
      {activeEnrollments.length === 0 && <p className="subtitle">Nobody currently enrolled.</p>}
    </div>
  );
}
