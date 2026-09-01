"use client";
import { useEffect, useState } from "react";
import { US_STATE_GRID } from "@/lib/usStateGrid";
import { STATE_PRICES } from "@/lib/statePrices";
import { formatCurrency } from "@/lib/formatCurrency";

export default function LicensingPage() {
  const [licensed, setLicensed] = useState(null);
  const [hovered, setHovered] = useState(null); // abbr of the state currently hovered
  const [saving, setSaving] = useState("");

  useEffect(() => {
    fetch("/api/licensed-states")
      .then((r) => r.json())
      .then((d) => setLicensed(new Set(d.states || [])));
  }, []);

  async function toggle(abbr) {
    if (!licensed || saving) return;
    const isLicensed = licensed.has(abbr);
    setSaving(abbr);

    const next = new Set(licensed);
    if (isLicensed) next.delete(abbr);
    else next.add(abbr);
    setLicensed(next);

    await fetch("/api/licensed-states", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: abbr, licensed: !isLicensed }),
    });
    setSaving("");
  }

  if (!licensed) return <p>Loading...</p>;

  const hoveredState = US_STATE_GRID.find((s) => s.abbr === hovered);
  const hoveredPrice = hovered ? STATE_PRICES[hovered] : null;

  return (
    <div>
      <h1>State Licensing</h1>
      <p className="subtitle">
        Click a state to mark it licensed or not. Licensed in {licensed.size} of {US_STATE_GRID.length}.
      </p>

      <div className="card" style={{ position: "relative", overflowX: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 44px)",
            gridTemplateRows: "repeat(8, 44px)",
            gap: 4,
            width: "max-content",
          }}
        >
          {US_STATE_GRID.map((s) => {
            const isLicensed = licensed.has(s.abbr);
            return (
              <button
                key={s.abbr}
                type="button"
                onClick={() => toggle(s.abbr)}
                onMouseEnter={() => setHovered(s.abbr)}
                onMouseLeave={() => setHovered(null)}
                title={s.name}
                style={{
                  gridColumn: s.col + 1,
                  gridRow: s.row + 1,
                  width: 44,
                  height: 44,
                  margin: 0,
                  padding: 0,
                  borderRadius: 6,
                  border: isLicensed ? "1px solid #22c55e" : "1px solid rgba(255,255,255,0.12)",
                  background: isLicensed ? "#16a34a" : "#1c1c1e",
                  color: isLicensed ? "#f0fdf4" : "#9a9a9a",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: saving ? "wait" : "pointer",
                  opacity: saving === s.abbr ? 0.6 : 1,
                  transition: "background 0.1s ease, opacity 0.1s ease",
                }}
              >
                {s.abbr}
              </button>
            );
          })}
        </div>

        {hoveredState && !licensed.has(hoveredState.abbr) && (
          <div
            style={{
              marginTop: 14,
              padding: "8px 14px",
              borderRadius: 8,
              background: "rgba(201, 162, 39, 0.08)",
              border: "1px solid rgba(201, 162, 39, 0.35)",
              display: "inline-block",
            }}
          >
            <strong>{hoveredState.name}</strong>{" "}
            <span style={{ color: "#9a9a9a" }}>
              — {hoveredPrice !== null && hoveredPrice !== undefined
                ? `${formatCurrency(hoveredPrice)} to license`
                : "price not set yet"}
            </span>
          </div>
        )}
      </div>

      <div className="row" style={{ marginTop: 4, gap: 20, justifyContent: "flex-start" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#9a9a9a" }}>
          <span style={{ width: 14, height: 14, borderRadius: 4, background: "#16a34a", display: "inline-block" }} />
          Licensed
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#9a9a9a" }}>
          <span style={{ width: 14, height: 14, borderRadius: 4, background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.12)", display: "inline-block" }} />
          Not Licensed - hover for price
        </span>
      </div>
    </div>
  );
}
