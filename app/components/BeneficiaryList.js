"use client";

export default function BeneficiaryList({ label, beneficiaries, onChange }) {
  function updateOne(index, field, value) {
    const next = [...beneficiaries];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  }

  function addOne() {
    onChange([...beneficiaries, { name: "", relationship: "", percentage: "" }]);
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
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
          <input
            placeholder="Name"
            value={b.name}
            onChange={(e) => updateOne(i, "name", e.target.value)}
            style={{ marginBottom: 0, flex: 2 }}
          />
          <input
            placeholder="Relationship"
            value={b.relationship}
            onChange={(e) => updateOne(i, "relationship", e.target.value)}
            style={{ marginBottom: 0, flex: 1 }}
          />
          <input
            placeholder="%"
            value={b.percentage}
            onChange={(e) => updateOne(i, "percentage", e.target.value)}
            style={{ marginBottom: 0, width: 60 }}
          />
          <button type="button" onClick={() => removeOne(i)} style={{ background: "#dc2626" }}>×</button>
        </div>
      ))}
    </div>
  );
}
