"use client";
import { useEffect, useState } from "react";
import { ALL_HOLIDAYS, WEEKDAY_NAMES, OCCURRENCE_LABELS } from "@/lib/holidays";

const FLOATING_HOLIDAYS = ALL_HOLIDAYS.filter((h) => h.kind === "floating");

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function OccasionDateLabel({ occasion }) {
  if (occasion.kind === "birthday") return <span className="subtitle">Each client's own birthday</span>;
  if (occasion.kind === "easter") return <span className="subtitle">Easter (date changes every year, calculated automatically)</span>;
  if (occasion.kind === "floating") {
    return (
      <span className="subtitle">
        {OCCURRENCE_LABELS[occasion.occurrence]} {WEEKDAY_NAMES[occasion.weekday]} of {MONTHS[occasion.month - 1]}{" "}
        (date changes every year, calculated automatically)
      </span>
    );
  }
  return <span className="subtitle">{MONTHS[occasion.month - 1]} {occasion.day}</span>;
}

export default function OccasionsPage() {
  const [occasions, setOccasions] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [kind, setKind] = useState("fixed");
  const [name, setName] = useState("");
  const [month, setMonth] = useState("1");
  const [day, setDay] = useState("1");
  const [weekday, setWeekday] = useState("4");
  const [occurrence, setOccurrence] = useState("4");
  const [newMessage, setNewMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  async function loadPreview() {
    setLoadingPreview(true);
    const res = await fetch("/api/occasions/preview");
    const data = await res.json();
    setLoadingPreview(false);
    setPreview(data);
  }

  async function load() {
    const res = await fetch("/api/occasions");
    const data = await res.json();
    setOccasions(data.occasions || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleEnabled(occasion) {
    await fetch("/api/occasions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: occasion.id, enabled: !occasion.enabled }),
    });
    load();
  }

  async function updateMessage(occasion, text) {
    await fetch("/api/occasions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: occasion.id, message: text }),
    });
  }

  async function removeOccasion(id) {
    if (!confirm("Remove this occasion from your checklist?")) return;
    await fetch("/api/occasions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  function fillFromCommonHoliday(e) {
    const holiday = FLOATING_HOLIDAYS.find((h) => h.name === e.target.value);
    if (!holiday) return;
    setKind("floating");
    setName(holiday.name);
    setMonth(String(holiday.month));
    setWeekday(String(holiday.weekday));
    setOccurrence(String(holiday.occurrence));
  }

  async function addOccasion(e) {
    e.preventDefault();
    setSaving(true);
    const body =
      kind === "fixed"
        ? { name, kind, month: Number(month), day: Number(day), message: newMessage }
        : { name, kind, month: Number(month), weekday: Number(weekday), occurrence: Number(occurrence), message: newMessage };

    const res = await fetch("/api/occasions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      setName("");
      setNewMessage("");
      setShowForm(false);
      setMessage("Added to your checklist.");
      load();
    } else {
      const d = await res.json();
      setMessage(d.error);
    }
  }

  if (!occasions) return <p>Loading...</p>;

  const visibleOccasions = occasions.filter((o) =>
    o.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div>
      <h1>Occasions</h1>
      <p className="subtitle">
        Automatic texts to your clients on birthdays and holidays you choose. Checked once a
        day — turn any of these on or off, and edit the message however you like. Never sent
        before 8am or after 8pm in each client's own local time zone.
        Placeholders: <code>{"{first_name}"}</code> and <code>{"{name}"}</code>.
      </p>

      {message && <p className="success">{message}</p>}

      <div className="card">
        <div className="row">
          <div>
            <strong>Preview today's sends</strong>
            <p className="subtitle" style={{ marginBottom: 0 }}>
              See exactly who would get a text today, based on your checklist — nothing
              actually sends when you click this.
            </p>
          </div>
          <button onClick={loadPreview} disabled={loadingPreview}>
            {loadingPreview ? "Checking..." : "Preview Today"}
          </button>
        </div>
        {preview && (
          <div style={{ marginTop: 12 }}>
            {preview.matches.length === 0 ? (
              <p className="subtitle" style={{ marginBottom: 0 }}>
                Nobody would get a text right now ({preview.checkedOn}) based on your current checklist.
              </p>
            ) : (
              <>
                <p className="subtitle" style={{ marginBottom: 6 }}>
                  {preview.matches.length} text{preview.matches.length === 1 ? "" : "s"} would go out right now ({preview.checkedOn}):
                </p>
                {preview.matches.map((m, i) => (
                  <div key={i} style={{ fontSize: 14, marginBottom: 4 }}>
                    <strong>{m.contact}</strong> ({m.phone}, {m.state}) — {m.occasion}
                  </div>
                ))}
              </>
            )}
            {preview.skippedQuietHours && preview.skippedQuietHours.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p className="subtitle" style={{ marginBottom: 6 }}>
                  {preview.skippedQuietHours.length} more would qualify today, but it's currently before 8am or
                  after 8pm in their local time zone, so they'll be held until tomorrow's check:
                </p>
                {preview.skippedQuietHours.map((m, i) => (
                  <div key={i} style={{ fontSize: 14, marginBottom: 4, color: "#9a9a9a" }}>
                    <strong>{m.contact}</strong> ({m.phone}, {m.state}) — {m.occasion}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <h3 style={{ marginTop: 24 }}>
        {visibleOccasions.length === occasions.length ? "Checklist" : "Showing"} ({visibleOccasions.length}
        {visibleOccasions.length !== occasions.length ? ` of ${occasions.length}` : ""})
      </h3>
      <input
        placeholder="Search occasions by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {visibleOccasions.map((o) => (
        <div className="card" key={o.id}>
          <div className="row">
            <div>
              <strong>{o.name}</strong>
              <div><OccasionDateLabel occasion={o} /></div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div className="checkbox-row" style={{ marginBottom: 0 }}>
                <input type="checkbox" checked={o.enabled} onChange={() => toggleEnabled(o)} />
                <span style={{ fontSize: 14 }}>{o.enabled ? "On" : "Off"}</span>
              </div>
              {o.kind !== "birthday" && (
                <button onClick={() => removeOccasion(o.id)} style={{ background: "#dc2626" }}>Remove</button>
              )}
            </div>
          </div>
          <textarea
            rows={2}
            defaultValue={o.message}
            onBlur={(e) => updateMessage(o, e.target.value)}
            placeholder="Message to send..."
            style={{ marginTop: 10, marginBottom: 0 }}
          />
        </div>
      ))}
      {occasions.length > 0 && visibleOccasions.length === 0 && (
        <p className="subtitle">No occasions match your search.</p>
      )}

      <button onClick={() => setShowForm(!showForm)} style={{ marginTop: 8 }}>
        {showForm ? "Cancel" : "+ Add a Custom Occasion"}
      </button>

      {showForm && (
        <form onSubmit={addOccasion} className="card" style={{ marginTop: 12 }}>
          <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>
            Quick-add a common holiday (fills in the fields below for you):
          </label>
          <select defaultValue="" onChange={fillFromCommonHoliday} style={{ marginBottom: 14 }}>
            <option value="" disabled>Choose one...</option>
            {FLOATING_HOLIDAYS.map((h) => <option key={h.name} value={h.name}>{h.name}</option>)}
          </select>

          <input placeholder="Occasion name" value={name} onChange={(e) => setName(e.target.value)} required />

          <div className="checkbox-row">
            <span className="subtitle">Type:</span>
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 14 }}>
              <input type="radio" checked={kind === "fixed"} onChange={() => setKind("fixed")} style={{ width: "auto" }} />
              Fixed date
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 14 }}>
              <input type="radio" checked={kind === "floating"} onChange={() => setKind("floating")} style={{ width: "auto" }} />
              Floating (e.g. "4th Thursday of November")
            </label>
          </div>

          {kind === "fixed" ? (
            <div style={{ display: "flex", gap: 8 }}>
              <select value={month} onChange={(e) => setMonth(e.target.value)} style={{ flex: 2 }}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select value={day} onChange={(e) => setDay(e.target.value)} style={{ flex: 1 }}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <select value={occurrence} onChange={(e) => setOccurrence(e.target.value)} style={{ flex: 1 }}>
                <option value="1">1st</option>
                <option value="2">2nd</option>
                <option value="3">3rd</option>
                <option value="4">4th</option>
                <option value="-1">Last</option>
              </select>
              <select value={weekday} onChange={(e) => setWeekday(e.target.value)} style={{ flex: 2 }}>
                {WEEKDAY_NAMES.map((w, i) => <option key={w} value={i}>{w}</option>)}
              </select>
              <select value={month} onChange={(e) => setMonth(e.target.value)} style={{ flex: 2 }}>
                <option value="" disabled>of...</option>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
          )}

          <textarea
            rows={2}
            placeholder="Message to send..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" disabled={saving}>{saving ? "Adding..." : "Add to Checklist"}</button>
        </form>
      )}
    </div>
  );
}
