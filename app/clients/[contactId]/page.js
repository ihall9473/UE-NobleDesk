"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AddressAutocomplete from "@/app/components/AddressAutocomplete";
import BeneficiaryList from "@/app/components/BeneficiaryList";
import { US_STATES } from "@/lib/usStates";
import { calculateAge } from "@/lib/age";

export default function ClientDetailPage() {
  const { contactId } = useParams();
  const [contact, setContact] = useState(null);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch(`/api/clients/${contactId}`);
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Couldn't load this client.");
      return;
    }
    setContact(data.contact);
    const d = data.contact.client_details || {};
    setForm({
      name: data.contact.name || "",
      phone: data.contact.phone || "",
      carrier: d.carrier || "",
      policyProduct: d.policy_product || "",
      coverageAmount: d.coverage_amount || "",
      monthlyPremium: d.monthly_premium || "",
      policyNumber: d.policy_number || "",
      draftDate: d.draft_date || "",
      applicationSubmittedDate: d.application_submitted_date || "",
      primaryBeneficiaries: d.primary_beneficiaries?.length ? d.primary_beneficiaries : [],
      contingentBeneficiaries: d.contingent_beneficiaries?.length ? d.contingent_beneficiaries : [],
      dateOfBirth: d.date_of_birth || "",
      birthState: d.birth_state || "",
      email: d.email || "",
      addressLine: d.address_line || "",
      city: d.city || "",
      state: d.state || "",
      zip: d.zip || "",
      health: d.health || "",
      height: d.height || "",
      weight: d.weight || "",
      bankName: d.bank_name || "",
      // Sensitive fields: intentionally left blank even though they're already
      // saved. Typing a new value replaces it; leaving blank keeps what's on file.
      ssn: "",
      routingNumber: "",
      accountNumber: "",
      hasSSN: !!d.ssn,
      hasRouting: !!d.routingNumber,
      hasAccount: !!d.accountNumber,
    });
  }

  useEffect(() => {
    load();
  }, [contactId]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/clients/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    const data = await res.json();
    if (res.ok) {
      setMessage("Saved.");
      load();
    } else {
      setMessage(data.error || "Something went wrong.");
    }
  }

  async function removeClient() {
    if (!confirm(`Remove ${form.name}? This deletes their full record and message history.`)) return;
    await fetch(`/api/clients/${contactId}`, { method: "DELETE" });
    window.location.href = "/clients";
  }

  if (!form) return <p>{message || "Loading..."}</p>;

  const age = calculateAge(form.dateOfBirth);

  return (
    <div>
      <a href="/clients" style={{ color: "#c9a227" }}>&larr; Back to Clients</a>
      <h1>{form.name}</h1>
      {message && <p className={message === "Saved." ? "success" : "error"}>{message}</p>}

      <form onSubmit={save}>
        <div className="card">
          <h3>Contact Info</h3>
          <input placeholder="Full name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          <input placeholder="Phone number" value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="off" />
        </div>

        <div className="card">
          <h3>Policy Details</h3>
          <input placeholder="Carrier" value={form.carrier} onChange={(e) => set("carrier", e.target.value)} />
          <select value={form.policyProduct} onChange={(e) => set("policyProduct", e.target.value)}>
            <option value="">Select policy product...</option>
            <option value="Whole Life">Whole Life</option>
            <option value="Term">Term</option>
            <option value="IUL">IUL</option>
          </select>
          <input placeholder="Policy Number" value={form.policyNumber} onChange={(e) => set("policyNumber", e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Amount of Coverage" value={form.coverageAmount} onChange={(e) => set("coverageAmount", e.target.value)} />
            <input placeholder="Monthly Premium" value={form.monthlyPremium} onChange={(e) => set("monthlyPremium", e.target.value)} />
          </div>
          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Draft Date</label>
          <input type="date" value={form.draftDate} onChange={(e) => set("draftDate", e.target.value)} />

          <label className="subtitle" style={{ display: "block", marginBottom: 4, marginTop: 8 }}>
            Application Submitted Date
          </label>
          <input
            type="date"
            value={form.applicationSubmittedDate}
            onChange={(e) => set("applicationSubmittedDate", e.target.value)}
          />
        </div>

        <div className="card">
          <h3>Personal Details</h3>
          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Date of Birth</label>
          <input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
          {age !== null && <p className="subtitle" style={{ marginTop: -8 }}>Age: {age}</p>}

          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Birth State</label>
          <select value={form.birthState} onChange={(e) => set("birthState", e.target.value)}>
            <option value="">Select state...</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <input placeholder="Health notes" value={form.health} onChange={(e) => set("health", e.target.value)} autoComplete="off" />
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder={'Height (e.g. 5\'10")'} value={form.height} onChange={(e) => set("height", e.target.value)} autoComplete="off" />
            <input placeholder="Weight (lbs)" value={form.weight} onChange={(e) => set("weight", e.target.value)} autoComplete="off" />
          </div>

          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>
            SSN {form.hasSSN && <span style={{ color: "#059669" }}>(on file — leave blank to keep)</span>}
          </label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder={form.hasSSN ? "•••-••-••••" : "SSN"}
            value={form.ssn}
            onChange={(e) => set("ssn", e.target.value)}
          />
        </div>

        <div className="card">
          <h3>Address</h3>
          <AddressAutocomplete
            value={form.addressLine}
            onChange={(v) => set("addressLine", v)}
            onSelect={({ addressLine, city, state, zip }) => {
              setForm((f) => ({ ...f, addressLine, city, state: state || f.state, zip }));
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="City" value={form.city} onChange={(e) => set("city", e.target.value)} autoComplete="off" />
            <select value={form.state} onChange={(e) => set("state", e.target.value)} style={{ maxWidth: 100 }}>
              <option value="">State</option>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input placeholder="Zip Code" value={form.zip} onChange={(e) => set("zip", e.target.value)} style={{ maxWidth: 120 }} autoComplete="off" />
          </div>
        </div>

        <div className="card">
          <h3>Beneficiaries</h3>
          <BeneficiaryList
            label="Primary Beneficiaries"
            beneficiaries={form.primaryBeneficiaries}
            onChange={(list) => set("primaryBeneficiaries", list)}
          />
          <BeneficiaryList
            label="Contingent Beneficiaries"
            beneficiaries={form.contingentBeneficiaries}
            onChange={(list) => set("contingentBeneficiaries", list)}
          />
        </div>

        <div className="card">
          <h3>Banking (for premium draft)</h3>
          <input placeholder="Bank Name" value={form.bankName} onChange={(e) => set("bankName", e.target.value)} autoComplete="off" />
          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>
            Routing Number {form.hasRouting && <span style={{ color: "#059669" }}>(on file — leave blank to keep)</span>}
          </label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder={form.hasRouting ? "••••••••" : "Routing Number"}
            value={form.routingNumber}
            onChange={(e) => set("routingNumber", e.target.value)}
          />
          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>
            Account Number {form.hasAccount && <span style={{ color: "#059669" }}>(on file — leave blank to keep)</span>}
          </label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder={form.hasAccount ? "••••••••" : "Account Number"}
            value={form.accountNumber}
            onChange={(e) => set("accountNumber", e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 40 }}>
          <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Client"}</button>
          <button type="button" onClick={removeClient} style={{ background: "#dc2626" }}>Delete Client</button>
        </div>
      </form>
    </div>
  );
}
