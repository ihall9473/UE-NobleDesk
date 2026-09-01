"use client";
import { useState, useRef } from "react";
import { formatPhoneInput } from "@/lib/phoneFormat";
import AddressAutocomplete from "@/app/components/AddressAutocomplete";
import BeneficiaryList from "@/app/components/BeneficiaryList";
import CarrierSelect from "@/app/components/CarrierSelect";
import { US_STATES } from "@/lib/usStates";
import { calculateAge } from "@/lib/age";

const initialForm = {
  firstName: "",
  lastName: "",
  smoker: "",
  contactState: "",
  dateOfBirth: "",
  height: "",
  weight: "",
  birthState: "",
  ssn: "",
  addressLine: "",
  aptUnit: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
  email: "",
  isOwner: "yes",
  ownerFirstName: "",
  ownerLastName: "",
  ownerRelationship: "",
  policyType: "first_write",
  originalCarrier: "",
  carrier: "",
  effectiveDate: "",
  draftDate: "",
  coverageAmount: "",
  monthlyPremium: "",
  policyProduct: "",
  graded: "",
  underwritingStage: "applied",
  policyStatus: "active",
  commissionStatus: "pending",
  termConversionDeadline: "",
  health: "",
  primaryBeneficiaries: [],
  contingentBeneficiaries: [],
  accountType: "",
  bankName: "",
  routingNumber: "",
  accountNumber: "",
  policyNumber: "",
};

export default function ClientSheetPage() {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [lookingUpBank, setLookingUpBank] = useState(false);
  const routingDebounce = useRef(null);

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

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const body = {
      ...form,
      name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      isOwner: form.isOwner === "yes",
      smoker: form.smoker === "" ? undefined : form.smoker === "yes",
      graded: form.graded === "" ? undefined : form.graded === "yes",
    };

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    const data = await res.json();
    if (res.ok) {
      window.location.href = `/clients/${data.contact.id}`;
    } else {
      setMessage(data.error || "Something went wrong.");
    }
  }

  const age = calculateAge(form.dateOfBirth);

  return (
    <div>
      <a href="/clients" style={{ color: "#c9a227" }}>&larr; Back to Clients</a>
      <h1>Client Sheet</h1>
      <p className="subtitle">
        Fill this out as you go through the application with your client - it creates the client
        record for you when you're done.
      </p>
      {message && <p className="error">{message}</p>}

      <form onSubmit={submit}>
        <div className="card">
          <h3>Proposed Insured</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="First Name" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} autoComplete="off" />
            <input placeholder="Last Name" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} autoComplete="off" />
          </div>

          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Smoker?</label>
          <select value={form.smoker} onChange={(e) => set("smoker", e.target.value)}>
            <option value="">Select...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>

          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>State</label>
          <select value={form.contactState} onChange={(e) => set("contactState", e.target.value)}>
            <option value="">Select state...</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Date of Birth</label>
          <input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
          {age !== null && <p className="subtitle" style={{ marginTop: -8 }}>Age: {age}</p>}

          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder={'Height (e.g. 5\'10")'} value={form.height} onChange={(e) => set("height", e.target.value)} autoComplete="off" />
            <input placeholder="Weight (lbs)" value={form.weight} onChange={(e) => set("weight", e.target.value)} autoComplete="off" />
          </div>

          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Birth State</label>
          <select value={form.birthState} onChange={(e) => set("birthState", e.target.value)}>
            <option value="">Select state...</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

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
          <h3>Contact Info</h3>
          <input placeholder="Phone number" value={form.phone} onChange={(e) => set("phone", formatPhoneInput(e.target.value))} autoComplete="off" />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="off" />
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
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Coverage Amount" value={form.coverageAmount} onChange={(e) => set("coverageAmount", e.target.value)} autoComplete="off" />
            <input placeholder="Monthly Premium" value={form.monthlyPremium} onChange={(e) => set("monthlyPremium", e.target.value)} autoComplete="off" />
          </div>

          <select value={form.policyProduct} onChange={(e) => set("policyProduct", e.target.value)}>
            <option value="">Select policy product...</option>
            <option value="Whole Life">Whole Life</option>
            <option value="IUL">IUL</option>
            <option value="Term">Term</option>
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

          {form.policyProduct === "Term" && (
            <>
              <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>
                Conversion Deadline
              </label>
              <p className="subtitle" style={{ marginTop: -4, marginBottom: 4 }}>
                Last day this term policy can still convert to permanent coverage.
              </p>
              <input
                type="date"
                value={form.termConversionDeadline}
                onChange={(e) => set("termConversionDeadline", e.target.value)}
              />
            </>
          )}
        </div>

        <div className="card">
          <h3>Pipeline & Commission</h3>
          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Underwriting Stage</label>
          <select value={form.underwritingStage} onChange={(e) => set("underwritingStage", e.target.value)}>
            <option value="applied">Applied</option>
            <option value="paramed_scheduled">Paramed Scheduled</option>
            <option value="paramed_complete">Paramed Complete</option>
            <option value="aps_requested">APS Requested</option>
            <option value="underwriting">Underwriting</option>
            <option value="approved">Approved</option>
            <option value="rated">Rated</option>
            <option value="declined">Declined</option>
            <option value="placed">Placed</option>
          </select>

          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Policy Status</label>
          <select value={form.policyStatus} onChange={(e) => set("policyStatus", e.target.value)}>
            <option value="active">Active</option>
            <option value="lapsed">Lapsed</option>
            <option value="chargeback">Chargeback</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Commission Status</label>
          <select value={form.commissionStatus} onChange={(e) => set("commissionStatus", e.target.value)}>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <div className="card">
          <h3>Health</h3>
          <textarea
            rows={3}
            placeholder="Health notes"
            value={form.health}
            onChange={(e) => set("health", e.target.value)}
          />
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
          <input placeholder="Policy Number" value={form.policyNumber} onChange={(e) => set("policyNumber", e.target.value)} autoComplete="off" />
        </div>

        <button type="submit" disabled={saving} style={{ marginBottom: 40 }}>
          {saving ? "Creating Client..." : "Create Client"}
        </button>
      </form>
    </div>
  );
}
