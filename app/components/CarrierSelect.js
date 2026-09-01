"use client";
import { useState } from "react";
import { CARRIERS } from "@/lib/carriers";

const CARRIER_NAMES = CARRIERS.map((c) => c.name);

// Picking from the known carrier list (instead of typing it freely) is
// what lets the comp-rate math on My Team match a policy to the right
// carrier. "Other" still falls back to free text for anything not on
// the list - it just won't have a comp rate to calculate against.
export default function CarrierSelect({ value, onChange }) {
  const isKnown = !value || CARRIER_NAMES.includes(value);
  const [showOther, setShowOther] = useState(!isKnown);

  if (showOther) {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Carrier name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          style={{ flex: 1 }}
        />
        <button
          type="button"
          onClick={() => {
            setShowOther(false);
            onChange("");
          }}
          style={{ width: "auto", marginBottom: 0 }}
        >
          Choose from list
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === "__other__") {
          setShowOther(true);
          onChange("");
        } else {
          onChange(e.target.value);
        }
      }}
    >
      <option value="">Select carrier...</option>
      {CARRIERS.map((c) => (
        <option key={c.id} value={c.name}>{c.name}</option>
      ))}
      <option value="__other__">Other (type it in)</option>
    </select>
  );
}
