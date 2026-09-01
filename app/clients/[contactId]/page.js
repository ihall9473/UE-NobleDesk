"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import AddressAutocomplete from "@/app/components/AddressAutocomplete";
import BeneficiaryList from "@/app/components/BeneficiaryList";
import CarrierSelect from "@/app/components/CarrierSelect";
import { US_STATES } from "@/lib/usStates";
import { calculateAge } from "@/lib/age";

export default function ClientDetailPage() {
  const { contactId } = useParams();
  const [contact, setContact] = useState(null);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [lookingUpBank, setLookingUpBank] = useState(false);
  const routingDebounce = useRef(null);

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
      contactState: data.contact.state || "",
      carrier: d.carrier || "",
      policyProduct: d.policy_product || "",
      graded: d.graded === true ? "yes" : d.graded === false ? "no" : "",
      coverageAmount: d.coverage_amount || "",
      monthlyPremium: d.monthly_premium || "",
      policyNumber: d.policy_number || "",
      policyType: d.policy_type || "first_write",
      originalCarrier: d.original_carrier || "",
      draftDate: d.draft_date || "",
      effectiveDate: d.effective_date || "",
      applicationSubmittedDate: d.application_submitted_date || "",
      primaryBeneficiaries: d.primary_beneficiaries?.length ? d.primary_beneficiaries : [],
      contingentBeneficiaries: d.contingent_beneficiaries?.length ? d.contingent_beneficiaries : [],
      dateOfBirth: d.date_of_birth || "",
      birthState: d.birth_state || "",
      smoker: d.smoker === true ? "yes" : d.smoker === false ? "no" : "",
      email: d.email || "",
      addressLine: d.address_line || "",
      aptUnit: d.apt_unit || "",
      city: d.city || "",
      state: d.state || "",
      zip: d.zip || "",
      health: d.health || "",
      height: d.height || "",
      weight: d.weight || "",
      isOwner: d.is_owner === false ? "no" : "yes",
      ownerFirstName: d.owner_first_name || "",
      ownerLastName: d.owner_last_name || "",
      ownerRelationship: d.owner_relationship || "",
      accountType: d.account_type || "",
      bankName: d.bank_name || "",
      ssn: d.ssn || "",
      routingNumber: d.routingNumber || "",
      accountNumber: d.accountNumber || "",
    });
  }

  useEffect(() => {
    load();
  }, [contactId]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleRoutingChange(value) {
    set("routingNumber", value);
    clearTimeout(routingDebounce.current);
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 9) return;
    routingDebounce.current = setTimeout(async () => {
      setLookingUpBank(true);
      try {
        const res = await fetch(`/api/routing-lookup?rn=${digits}`);
        const data = await res.json();
        if (data.bankName) set("bankName", data.bankName);
      } catch {
        // best-effort - bank name stays editable either way
      }
      setLookingUpBank(false);
    }, 500);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const body = {
      ...form,
      isOwner: form.isOwner === "no" ? false : true,
      smoker: form.smoker === "" ? undefined : form.smoker === "yes",
      graded: form.graded === "" ? undefined : form.graded === "yes",
    };
    const res = await fetch(`/api/clients/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
    if (!confirm(`Remove ${form.name}?`)) return;
    await fetch(`/api/clients/${contactId}`, { method: "DELETE" });
    window.location.href = `/clients?undoId=${contactId}&undoName=${encodeURIComponent(form.name)}`;
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
          <input placeholder="Full name" value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="off" required />
          <input placeholder="Phone number" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="off" required />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="off" />

          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>State</label>
          <select value={form.contactState} onChange={(e) => set("contactState", e.target.value)}>
            <option value="">Select state...</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="card">
          <h3>Ownership</h3>
          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>
            Is Proposed Insured the Owner?
          </label>
          <select value={form.isOwner} onChange={(e) => set("isOwner", e.target.value)}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>

          {form.isOwner === "no" && (
            <div style={{ marginTop: 8 }}>
              <h3 style={{ fontSize: 15 }}>Owner</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <input placeholder="Owner First Name" value={form.ownerFirstName} onChange={(e) => set("ownerFirstName", e.target.value)} autoComplete="off" />
                <input placeholder="Owner Last Name" value={form.ownerLastName} onChange={(e) => set("ownerLastName", e.target.value)} autoComplete="off" />
              </div>
              <input placeholder="Relationship to Insured" value={form.ownerRelationship} onChange={(e) => set("ownerRelationship", e.target.value)} autoComplete="off" />
            </div>
          )}
        </div>

        <div className="card">
          <h3>Policy Details</h3>
          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>
            First Write or Policy Flip?
          </label>
          <select value={form.policyType} onChange={(e) => set("policyType", e.target.value)}>
            <option value="first_write">First Write</option>
            <option value="policy_flip">Policy Flip</option>
          </select>
          {form.policyType === "policy_flip" && (
            <input
              placeholder="Original Policy Carrier"
              value={form.originalCarrier}
              onChange={(e) => set("originalCarrier", e.target.value)}
              autoComplete="off"
            />
          )}

          <CarrierSelect value={form.carrier} onChange={(v) => set("carrier", v)} />
          <select value={form.policyProduct} onChange={(e) => set("policyProduct", e.target.value)}>
            <option value="">Select policy product...</option>
            <option value="Whole Life">Whole Life</option>
            <option value="Term">Term</option>
            <option value="IUL">IUL</option>
          </select>
          {form.policyProduct === "Whole Life" && (
            <>
              <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Graded?</label>
              <select value={form.graded} onChange={(e) => set("graded", e.target.value)}>
                <option value="">Select...</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </>
          )}
          <input placeholder="Policy Number" value={form.policyNumber} onChange={(e) => set("policyNumber", e.target.value)} autoComplete="off" />
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Amount of Coverage" value={form.coverageAmount} onChange={(e) => set("coverageAmount", e.target.value)} autoComplete="off" />
            <input placeholder="Monthly Premium" value={form.monthlyPremium} onChange={(e) => set("monthlyPremium", e.target.value)} autoComplete="off" />
          </div>
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
          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Smoker?</label>
          <select value={form.smoker} onChange={(e) => set("smoker", e.target.value)}>
            <option value="">Select...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>

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

          <input
            autoComplete="off"
            placeholder="SSN"
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
          <input placeholder="Apt / Ste #" value={form.aptUnit} onChange={(e) => set("aptUnit", e.target.value)} autoComplete="off" />
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
          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Effective Date</label>
          <input type="date" value={form.effectiveDate} onChange={(e) => set("effectiveDate", e.target.value)} />

          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Draft Date</label>
          <input type="date" value={form.draftDate} onChange={(e) => set("draftDate", e.target.value)} />

          <select value={form.accountType} onChange={(e) => set("accountType", e.target.value)}>
            <option value="">Account Type...</option>
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
            <option value="direct_express">Direct Express</option>
          </select>
          <input
            autoComplete="off"
            placeholder="Routing Number"
            value={form.routingNumber}
            onChange={(e) => handleRoutingChange(e.target.value)}
          />
          <input
            placeholder={lookingUpBank ? "Looking up bank..." : "Bank Name"}
            value={form.bankName}
            onChange={(e) => set("bankName", e.target.value)}
            autoComplete="off"
          />
          <input
            autoComplete="off"
            placeholder="Account Number"
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
