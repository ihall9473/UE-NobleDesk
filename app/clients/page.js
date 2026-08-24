"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DATE_PRESETS, getDateRange } from "@/lib/dateRanges";
import UndoToast from "@/app/components/UndoToast";

// Splits the stored full name into first/last for filtering and sorting,
// without needing separate name fields in the database.
function splitName(fullName) {
  const parts = (fullName || "").trim().split(/\s+/);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") || "" };
}

// Isolated in its own component (and Suspense boundary below) since
// useSearchParams() would otherwise force the whole page out of static
// rendering. Picked up right after deleting a client from their detail
// page, which redirects here with these params since it can't show its
// own toast.
function UndoFromQuery({ onFound }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const undoId = searchParams.get("undoId");
    if (undoId) {
      onFound({ id: undoId, name: searchParams.get("undoName") });
      router.replace("/clients");
    }
  }, [searchParams, router, onFound]);

  return null;
}

export default function ClientsPage() {
  const [clients, setClients] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [undo, setUndo] = useState(null); // { id, text } - shown as a dismissable toast

  const [search, setSearch] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("firstName"); // firstName | lastName | carrier | state
  const [datePreset, setDatePreset] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  async function load() {
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClients(data.clients || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function undoRemove() {
    if (!undo) return;
    await fetch(`/api/clients/${undo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restore: true }),
    });
    setUndo(null);
    load();
  }

  async function addClient(e) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    setLoading(false);
    const data = await res.json();
    if (res.ok) {
      setName("");
      setPhone("");
      window.location.href = `/clients/${data.contact.id}`;
    } else {
      setMessage(data.error || "Something went wrong.");
    }
  }

  const allClients = clients || [];

  const carrierOptions = [...new Set(allClients.map((c) => c.client_details?.carrier).filter(Boolean))].sort();
  const stateOptions = [...new Set(allClients.map((c) => c.client_details?.state).filter(Boolean))].sort();

  const dateRange = getDateRange(datePreset, customDate, customStart, customEnd);

  let visible = allClients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchesCarrier = carrierFilter === "all" || c.client_details?.carrier === carrierFilter;
    const matchesState = stateFilter === "all" || c.client_details?.state === stateFilter;

    let matchesDate = true;
    if (dateRange) {
      const submitted = c.client_details?.application_submitted_date;
      matchesDate = !!submitted && submitted >= dateRange.start && submitted <= dateRange.end;
    }

    return matchesSearch && matchesCarrier && matchesState && matchesDate;
  });

  visible = [...visible].sort((a, b) => {
    if (sortBy === "firstName") return splitName(a.name).first.localeCompare(splitName(b.name).first);
    if (sortBy === "lastName") return splitName(a.name).last.localeCompare(splitName(b.name).last);
    if (sortBy === "carrier") return (a.client_details?.carrier || "").localeCompare(b.client_details?.carrier || "");
    if (sortBy === "state") return (a.client_details?.state || "").localeCompare(b.client_details?.state || "");
    return 0;
  });

  const totalMonthly = visible.reduce((sum, c) => {
    const raw = c.client_details?.monthly_premium;
    if (!raw) return sum;
    const num = parseFloat(String(raw).replace(/[^0-9.]/g, ""));
    return isNaN(num) ? sum : sum + num;
  }, 0);
  const totalAnnual = totalMonthly * 12;
  const clientsWithPremium = visible.filter((c) => c.client_details?.monthly_premium).length;
  const isFiltered = search || carrierFilter !== "all" || stateFilter !== "all" || datePreset !== "all";

  return (
    <div>
      <Suspense fallback={null}>
        <UndoFromQuery onFound={(u) => setUndo({ id: u.id, text: `Removed ${u.name || "client"}.` })} />
      </Suspense>
      <h1>Clients</h1>
      <p className="subtitle">Your book of business — full policy and contact details for every client.</p>

      {allClients.length > 0 && (
        <div className="card" style={{ background: "rgba(201, 162, 39, 0.06)", border: "1px solid rgba(201, 162, 39, 0.35)" }}>
          <div className="row">
            <div>
              <div className="label-caps">
                TOTAL ANNUAL PREMIUM{isFiltered ? " (FILTERED)" : ""}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#f5f5f5" }}>
                ${totalAnnual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div style={{ textAlign: "right", color: "#9a9a9a", fontSize: 13 }}>
              ${totalMonthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo total
              <br />
              across {clientsWithPremium} of {isFiltered ? visible.length : allClients.length} clients
            </div>
          </div>
        </div>
      )}

      {message && <p className="error">{message}</p>}

      <div className="card">
        <h3>Add a new client</h3>
        <p className="subtitle" style={{ marginBottom: 8 }}>
          Just their name and number to start — you'll fill in policy details on the next page.
        </p>
        <form onSubmit={addClient}>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Client & Continue"}</button>
        </form>
      </div>

      <div className="card">
        <input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Carrier</label>
            <select value={carrierFilter} onChange={(e) => setCarrierFilter(e.target.value)} style={{ marginBottom: 0 }}>
              <option value="all">All Carriers</option>
              {carrierOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>State</label>
            <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} style={{ marginBottom: 0 }}>
              <option value="all">All States</option>
              {stateOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Sort by</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ marginBottom: 0 }}>
              <option value="firstName">First Name</option>
              <option value="lastName">Last Name</option>
              <option value="carrier">Carrier</option>
              <option value="state">State</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>
              Application Submitted
            </label>
            <select value={datePreset} onChange={(e) => setDatePreset(e.target.value)} style={{ marginBottom: 0 }}>
              {DATE_PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {datePreset === "customDate" && (
          <div style={{ marginTop: 10 }}>
            <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Date</label>
            <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} style={{ marginBottom: 0 }} />
          </div>
        )}

        {datePreset === "customRange" && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <div style={{ flex: 1 }}>
              <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>From</label>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={{ marginBottom: 0 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>To</label>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={{ marginBottom: 0 }} />
            </div>
          </div>
        )}

        {isFiltered && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCarrierFilter("all");
              setStateFilter("all");
              setDatePreset("all");
              setCustomDate("");
              setCustomStart("");
              setCustomEnd("");
            }}
            style={{ marginTop: 10, background: "#6b7280" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <h3>
        {visible.length === allClients.length ? "All Clients" : "Showing"} ({visible.length}
        {visible.length !== allClients.length ? ` of ${allClients.length}` : ""})
      </h3>
      {clients === null && <p>Loading...</p>}
      {visible.map((c) => {
        const d = c.client_details || {};
        return (
          <a href={`/clients/${c.id}`} key={c.id} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card">
              <div className="row">
                <strong>{c.name}</strong>
                <span style={{ fontSize: 13, color: "#9a9a9a" }}>{c.phone}</span>
              </div>
              <div style={{ color: "#9a9a9a", fontSize: 13, marginTop: 4 }}>
                {d.carrier || "No carrier set"}
                {d.policy_product ? ` · ${d.policy_product}` : ""}
                {d.coverage_amount ? ` · $${d.coverage_amount} coverage` : ""}
                {d.state ? ` · ${d.state}` : ""}
              </div>
            </div>
          </a>
        );
      })}
      {allClients.length === 0 && (
        <p className="subtitle">No clients yet. Add one above, or move a lead over from the Leads page.</p>
      )}
      {allClients.length > 0 && visible.length === 0 && (
        <p className="subtitle">No clients match your search/filters.</p>
      )}
      <UndoToast text={undo?.text} onUndo={undoRemove} onDismiss={() => setUndo(null)} />
    </div>
  );
}
