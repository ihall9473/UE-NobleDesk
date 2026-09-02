"use client";
import { useEffect, useRef, useState } from "react";
import USAMap from "react-usa-map";
import { US_STATE_GRID } from "@/lib/usStateGrid";
import { STATE_PRICES } from "@/lib/statePrices";
import { formatCurrency } from "@/lib/formatCurrency";

const STATE_NAMES = Object.fromEntries(US_STATE_GRID.map((s) => [s.abbr, s.name]));
const ALL_ABBRS = US_STATE_GRID.map((s) => s.abbr).sort((a, b) =>
  STATE_NAMES[a].localeCompare(STATE_NAMES[b])
);

const LICENSED_COLOR = "#16a34a";
const UNLICENSED_COLOR = "#3a3a3a";

export default function LicensingPage() {
  const [licensed, setLicensed] = useState(null);
  const [documents, setDocuments] = useState({}); // abbr -> { name, uploadedAt }
  const [hovered, setHovered] = useState(null); // abbr currently hovered
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState("");
  const [uploadTarget, setUploadTarget] = useState(null); // abbr the next file picked is for
  const [uploading, setUploading] = useState("");
  const [message, setMessage] = useState("");
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  async function loadStates() {
    const res = await fetch("/api/licensed-states");
    const d = await res.json();
    setLicensed(new Set(d.states || []));
    setDocuments(d.documents || {});
  }

  useEffect(() => {
    loadStates();
  }, []);

  function startUpload(abbr) {
    setUploadTarget(abbr);
    fileInputRef.current?.click();
  }

  async function handleFileChosen(e) {
    const file = e.target.files?.[0];
    const abbr = uploadTarget;
    e.target.value = "";
    if (!file || !abbr) return;

    if (file.type !== "application/pdf") {
      setMessage("Only PDF files are accepted.");
      return;
    }

    setUploading(abbr);
    setMessage("");
    const form = new FormData();
    form.append("state", abbr);
    form.append("file", file);
    const res = await fetch("/api/licensed-states/document", { method: "POST", body: form });
    setUploading("");
    if (res.ok) {
      await loadStates();
    } else {
      const d = await res.json();
      setMessage(d.error || "Something went wrong uploading that PDF.");
    }
  }

  async function viewDocument(abbr) {
    const res = await fetch(`/api/licensed-states/document?state=${abbr}`);
    const d = await res.json();
    if (d.url) window.open(d.url, "_blank");
    else setMessage(d.error || "Couldn't open that PDF.");
  }

  async function removeDocument(abbr) {
    if (!confirm(`Remove the license PDF for ${STATE_NAMES[abbr]}? The state stays licensed either way.`)) return;
    await fetch("/api/licensed-states/document", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: abbr }),
    });
    loadStates();
  }

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

  function handleMapClick(event) {
    const abbr = event.target?.dataset?.name;
    if (abbr) toggle(abbr);
  }

  function handleMouseOver(event) {
    const abbr = event.target?.dataset?.name;
    if (abbr) setHovered(abbr);
  }

  function handleMouseMove(event) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  }

  if (!licensed) return <p>Loading...</p>;

  const customize = {};
  for (const abbr of ALL_ABBRS) {
    if (abbr === "DC") continue;
    customize[abbr] = { fill: licensed.has(abbr) ? LICENSED_COLOR : UNLICENSED_COLOR };
  }
  // The library renders DC as its own tiny inset shape (DC1) plus a
  // visible dot (DC2), each colored separately from every other state.
  const dcColor = licensed.has("DC") ? LICENSED_COLOR : UNLICENSED_COLOR;
  customize.DC1 = { fill: dcColor };
  customize.DC2 = { fill: dcColor };

  const hoveredName = hovered ? STATE_NAMES[hovered] : null;
  const hoveredPrice = hovered ? STATE_PRICES[hovered] : null;
  const hoveredIsLicensed = hovered ? licensed.has(hovered) : false;

  return (
    <div>
      <h1>State Licensing</h1>
      <p className="subtitle">
        Click a state to mark it licensed or not. Licensed in {licensed.size} of {ALL_ABBRS.length}.
        Attaching a license PDF is optional.
      </p>

      {message && <p className="error">{message}</p>}

      <input
        type="file"
        accept="application/pdf"
        ref={fileInputRef}
        onChange={handleFileChosen}
        style={{ display: "none" }}
      />

      <style>{`
        .us-state-map { width: 100%; height: auto; display: block; }
        .us-state-map path, .us-state-map circle { cursor: pointer; stroke: #0e0e0f; stroke-width: 0.75; }
        .us-state-map path:hover, .us-state-map circle:hover { opacity: 0.82; }
      `}</style>

      <div className="card" style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div
          ref={containerRef}
          style={{ position: "relative", flex: "2 1 480px", minWidth: 280 }}
          onMouseOver={handleMouseOver}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHovered(null)}
        >
          <USAMap
            customize={customize}
            onClick={handleMapClick}
            defaultFill={UNLICENSED_COLOR}
            title="State Licensing Map"
          />
          {hovered && (
            <div
              style={{
                position: "absolute",
                left: tooltipPos.x + 14,
                top: tooltipPos.y + 14,
                pointerEvents: "none",
                background: "#1c1c1e",
                border: "1px solid rgba(201, 162, 39, 0.4)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                whiteSpace: "nowrap",
                zIndex: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              <strong>{hoveredName}</strong>
              <div style={{ color: "#9a9a9a", marginTop: 2 }}>
                {hoveredIsLicensed
                  ? "Licensed"
                  : hoveredPrice !== null && hoveredPrice !== undefined
                  ? `${formatCurrency(hoveredPrice)} to license`
                  : "Price not set yet"}
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: "1 1 240px", minWidth: 220, maxHeight: 500, overflowY: "auto" }}>
          <div className="label-caps" style={{ marginBottom: 8 }}>States</div>
          {ALL_ABBRS.map((abbr) => {
            const isLicensed = licensed.has(abbr);
            const doc = documents[abbr];
            return (
              <div
                key={abbr}
                onMouseEnter={() => setHovered(abbr)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  marginBottom: 2,
                  padding: "6px 8px",
                  borderRadius: 6,
                  background: hovered === abbr ? "rgba(255,255,255,0.06)" : "transparent",
                }}
              >
                <div className="row" onClick={() => toggle(abbr)} style={{ marginBottom: 0, cursor: saving ? "wait" : "pointer" }}>
                  <span style={{ fontSize: 14 }}>{STATE_NAMES[abbr]} ({abbr})</span>
                  <span style={{ fontSize: 13, color: isLicensed ? "#22c55e" : "#9a9a9a", fontWeight: isLicensed ? 600 : 400 }}>
                    {isLicensed
                      ? "Licensed"
                      : STATE_PRICES[abbr] !== null && STATE_PRICES[abbr] !== undefined
                      ? formatCurrency(STATE_PRICES[abbr])
                      : "—"}
                  </span>
                </div>
                {isLicensed && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: "flex", gap: 8, marginTop: 3, fontSize: 12 }}
                  >
                    {doc ? (
                      <>
                        <a
                          onClick={() => viewDocument(abbr)}
                          style={{ color: "#c9a227", cursor: "pointer" }}
                          title={doc.name}
                        >
                          View License PDF
                        </a>
                        <a onClick={() => removeDocument(abbr)} style={{ color: "#666", cursor: "pointer" }}>
                          Remove
                        </a>
                      </>
                    ) : (
                      <a
                        onClick={() => startUpload(abbr)}
                        style={{ color: "#9a9a9a", cursor: uploading === abbr ? "wait" : "pointer" }}
                      >
                        {uploading === abbr ? "Uploading..." : "+ Add License PDF (optional)"}
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="row" style={{ marginTop: 4, gap: 20, justifyContent: "flex-start" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#9a9a9a" }}>
          <span style={{ width: 14, height: 14, borderRadius: 4, background: LICENSED_COLOR, display: "inline-block" }} />
          Licensed
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#9a9a9a" }}>
          <span style={{ width: 14, height: 14, borderRadius: 4, background: UNLICENSED_COLOR, display: "inline-block" }} />
          Not Licensed - hover or click for price
        </span>
      </div>
    </div>
  );
}
