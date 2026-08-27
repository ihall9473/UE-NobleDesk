"use client";

export default function BeneficiaryList({ label, beneficiaries, onChange }) {
  function updateOne(index, field, value) {
    const next = [...beneficiaries];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  }

  function addOne() {
    onChange([
      ...beneficiaries,
      { firstName: "", lastName: "", relationship: "", percentage: "", phone: "", address: "", dateOfBirth: "" },
    ]);
  }

  function removeOne(index) {
    onChange(beneficiaries.filter((_, i) => i !== index));
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="row" style={{ marginBottom: 6 }}>
        <strong style={{ fontSize: 14 }}>{label}</strong>
        <button type="button" onClick={addOne}>+ Add</button>
      </div>
      {beneficiaries.length === 0 && (
        <p className="subtitle" style={{ marginBottom: 8 }}>None added yet.</p>
      )}
      {beneficiaries.map((b, i) => (
        <div key={i} className="card" style={{ marginBottom: 10, padding: 14 }}>
          <div className="row" style={{ marginBottom: 8 }}>
            <span className="subtitle" style={{ fontSize: 12 }}>Beneficiary {i + 1}</span>
            <button type="button" onClick={() => removeOne(i)} style={{ background: "#dc2626" }}>×</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="First Name"
              value={b.firstName || ""}
              onChange={(e) => updateOne(i, "firstName", e.target.value)}
              style={{ marginBottom: 8, flex: 1 }}
            />
            <input
              placeholder="Last Name"
              value={b.lastName || ""}
              onChange={(e) => updateOne(i, "lastName", e.target.value)}
              style={{ marginBottom: 8, flex: 1 }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Relationship"
              value={b.relationship || ""}
              onChange={(e) => updateOne(i, "relationship", e.target.value)}
              style={{ marginBottom: 8, flex: 1 }}
            />
            <input
              placeholder="%"
              value={b.percentage || ""}
              onChange={(e) => updateOne(i, "percentage", e.target.value)}
              style={{ marginBottom: 8, width: 60 }}
            />
          </div>
          <input
            placeholder="Phone Number"
            value={b.phone || ""}
            onChange={(e) => updateOne(i, "phone", e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <input
            placeholder="Address"
            value={b.address || ""}
            onChange={(e) => updateOne(i, "address", e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Date of Birth</label>
          <input
            type="date"
            value={b.dateOfBirth || ""}
            onChange={(e) => updateOne(i, "dateOfBirth", e.target.value)}
            style={{ marginBottom: 0 }}
          />
        </div>
      ))}
    </div>
  );
}
