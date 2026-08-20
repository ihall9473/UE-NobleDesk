"use client";
import { useState, useRef } from "react";

// Free address lookup (no API key/billing needed) via OpenStreetMap's
// Nominatim service. Debounced so we're not hammering it on every keystroke.
export default function AddressAutocomplete({ value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  function handleInput(text) {
    onChange(text);
    clearTimeout(debounceRef.current);
    if (text.trim().length < 5) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => search(text), 500);
  }

  async function search(text) {
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=us&limit=5&q=${encodeURIComponent(text)}`,
        { headers: { Accept: "application/json" } }
      );
      const data = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    }
    setLoading(false);
  }

  function pick(place) {
    const a = place.address || {};
    const streetLine = [a.house_number, a.road].filter(Boolean).join(" ");
    onSelect({
      addressLine: streetLine || place.display_name.split(",")[0],
      city: a.city || a.town || a.village || a.county || "",
      state: a.state || "",
      zip: a.postcode || "",
    });
    setSuggestions([]);
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        placeholder="Start typing an address..."
        value={value}
        onChange={(e) => handleInput(e.target.value)}
        autoComplete="off"
      />
      {suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #ccc",
            borderRadius: 8,
            zIndex: 10,
            maxHeight: 200,
            overflowY: "auto",
            marginTop: -8,
          }}
        >
          {suggestions.map((s) => (
            <div
              key={s.place_id}
              onClick={() => pick(s)}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: 14, borderBottom: "1px solid #eee" }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {s.display_name}
            </div>
          ))}
        </div>
      )}
      {loading && <p className="subtitle" style={{ marginTop: -8 }}>Searching...</p>}
    </div>
  );
}
