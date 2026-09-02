"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DATE_PRESETS, getDateRange } from "@/lib/dateRanges";
import { nextDraftInfo } from "@/lib/draftDate";
import { daysUntilConversion } from "@/lib/termConversion";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatDate } from "@/lib/formatDate";
import UndoToast from "@/app/components/UndoToast";

const DRAFT_WARNING_DAYS = 5;
const CONVERSION_WARNING_DAYS = 365;

const UNDERWRITING_LABELS = {
  applied: "Applied",
  paramed_scheduled: "Paramed Scheduled",
  paramed_complete: "Paramed Complete",
  aps_requested: "APS Requested",
  underwriting: "Underwriting",
  approved: "Approved",
  rated: "Rated",
  declined: "Declined",
  placed: "Placed",
};

const POLICY_STATUS_LABELS = {
  lapsed: "Lapsed",
  chargeback: "Chargeback",
  cancelled: "Cancelled",
};

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
  const [sortBy, setSortBy] = useState("firstName"); // firstName | lastName | carrier | state | effectiveDate | submittedDate
  const [datePreset, setDatePreset] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [effectiveDatePreset, setEffectiveDatePreset] = useState("all");
  const [effectiveCustomDate, setEffectiveCustomDate] = useState("");
  const [effectiveCustomStart, setEffectiveCustomStart] = useState("");
  const [effectiveCustomEnd, setEffectiveCustomEnd] = useState("");
  const [atRiskOnly, setAtRiskOnly] = useState(false);

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
  const effectiveDateRange = getDateRange(effectiveDatePreset, effectiveCustomDate, effectiveCustomStart, effectiveCustomEnd);

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

    let matchesEffectiveDate = true;
    if (effectiveDateRange) {
      const effective = c.client_details?.effective_date;
      matchesEffectiveDate = !!effective && effective >= effectiveDateRange.start && effective <= effectiveDateRange.end;
    }

    const matchesAtRisk = !atRiskOnly || ["lapsed", "chargeback"].includes(c.client_details?.policy_status);

    return matchesSearch && matchesCarrier && matchesState && matchesDate && matchesEffectiveDate && matchesAtRisk;
  });

  visible = [...visible].sort((a, b) => {
    if (sortBy === "firstName") return splitName(a.name).first.localeCompare(splitName(b.name).first);
    if (sortBy === "lastName") return splitName(a.name).last.localeCompare(splitName(b.name).last);
    if (sortBy === "carrier") return (a.client_details?.carrier || "").localeCompare(b.client_details?.carrier || "");
    if (sortBy === "state") return (a.client_details?.state || "").localeCompare(b.client_details?.state || "");
    if (sortBy === "effectiveDate") return (a.client_details?.effective_date || "").localeCompare(b.client_details?.effective_date || "");
    if (sortBy === "submittedDate") return (a.client_details?.application_submitted_date || "").localeCompare(b.client_details?.application_submitted_date || "");
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
  const isFiltered =
    search || carrierFilter !== "all" || stateFilter !== "all" || datePreset !== "all" ||
    effectiveDatePreset !== "all" || atRiskOnly;

  const upcomingDrafts = allClients
    .map((c) => ({ client: c, draft: nextDraftInfo(c.client_details?.draft_date) }))
    .filter(({ draft }) => draft && draft.daysUntil >= 0 && draft.daysUntil <= DRAFT_WARNING_DAYS)
    .sort((a, b) => a.draft.daysUntil - b.draft.daysUntil);

  const upcomingConversions = allClients
    .map((c) => ({ client: c, daysUntil: daysUntilConversion(c.client_details?.term_conversion_deadline) }))
    .filter(({ daysUntil }) => daysUntil !== null && daysUntil >= 0 && daysUntil <= CONVERSION_WARNING_DAYS)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const atRiskCount = allClients.filter((c) =>
    ["lapsed", "chargeback"].includes(c.client_details?.policy_status)
  ).length;

  return (
    <div>
      <Suspense fallback={null}>
        <UndoFromQuery onFound={(u) => setUndo({ id: u.id, text: `Removed ${u.name || "client"}.` })} />
      </Suspense>
      <div className="row" style={{ marginBottom: 0 }}>
        <h1 style={{ marginBottom: 0 }}>Clients</h1>
        <a href="/dashboard" style={{ textDecoration: "none" }}>
          <button type="button" style={{ width: "auto", marginBottom: 0 }}>Book of Business</button>
        </a>
      </div>
      <p className="subtitle">Your book of business — full policy and contact details for every client.</p>

      <a href="/clients/sheet" style={{ textDecoration: "none" }}>
        <button type="button" style={{ marginBottom: 16 }}>
          Open Client Sheet
        </button>
      </a>

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

      {upcomingDrafts.length > 0 && (
        <div className="card" style={{ background: "rgba(248, 113, 113, 0.06)", border: "1px solid rgba(248, 113, 113, 0.35)" }}>
          <div className="label-caps" style={{ color: "var(--danger)" }}>
            Upcoming Premium Drafts
          </div>
          <p className="subtitle" style={{ marginTop: 4, marginBottom: 8 }}>
            Get ahead of an NSF or lapse — a heads-up before these draft, based on the draft date
            saved on each client.
          </p>
          {upcomingDrafts.map(({ client, draft }) => (
            <a
              key={client.id}
              href={`/clients/${client.id}`}
              style={{ display: "block", textDecoration: "none", color: "inherit", fontSize: 14, marginBottom: 4 }}
            >
              <strong>{client.name}</strong>{" "}
              <span style={{ color: "#9a9a9a" }}>
                — {draft.daysUntil === 0 ? "drafts today" : `drafts in ${draft.daysUntil} day${draft.daysUntil === 1 ? "" : "s"}`}
                {client.client_details?.monthly_premium ? ` (${formatCurrency(client.client_details.monthly_premium)})` : ""}
              </span>
            </a>
          ))}
        </div>
      )}

      {upcomingConversions.length > 0 && (
        <div className="card" style={{ background: "rgba(201, 162, 39, 0.06)", border: "1px solid rgba(201, 162, 39, 0.35)" }}>
          <div className="label-caps" style={{ color: "var(--gold)" }}>
            Upcoming Term Conversion Deadlines
          </div>
          <p className="subtitle" style={{ marginTop: 4, marginBottom: 8 }}>
            Miss one of these and the client loses the option to convert this term policy to
            permanent coverage for good.
          </p>
          {upcomingConversions.map(({ client, daysUntil }) => (
            <a
              key={client.id}
              href={`/clients/${client.id}`}
              style={{ display: "block", textDecoration: "none", color: "inherit", fontSize: 14, marginBottom: 4 }}
            >
              <strong>{client.name}</strong>{" "}
              <span style={{ color: "#9a9a9a" }}>
                — {daysUntil === 0 ? "deadline is today" : `${daysUntil} day${daysUntil === 1 ? "" : "s"} left to convert`}
              </span>
            </a>
          ))}
        </div>
      )}

      {atRiskCount > 0 && (
        <div className="card" style={{ background: "rgba(248, 113, 113, 0.06)", border: "1px solid rgba(248, 113, 113, 0.35)" }}>
          <div className="row" style={{ marginBottom: 0 }}>
            <div className="label-caps" style={{ color: "var(--danger)" }}>
              {atRiskCount} polic{atRiskCount === 1 ? "y" : "ies"} at chargeback risk
            </div>
            <button
              type="button"
              onClick={() => setAtRiskOnly((v) => !v)}
              style={{ width: "auto", marginBottom: 0 }}
            >
              {atRiskOnly ? "Show All" : "Show Only These"}
            </button>
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
              <option value="effectiveDate">Effective Date</option>
              <option value="submittedDate">Application Submitted Date</option>
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
          <div style={{ flex: 1, minWidth: 160 }}>
            <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>
              Effective Date
            </label>
            <select value={effectiveDatePreset} onChange={(e) => setEffectiveDatePreset(e.target.value)} style={{ marginBottom: 0 }}>
              {DATE_PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {datePreset === "customDate" && (
          <div style={{ marginTop: 10 }}>
            <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Application Submitted Date</label>
            <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} style={{ marginBottom: 0 }} />
          </div>
        )}

        {datePreset === "customRange" && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <div style={{ flex: 1 }}>
              <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Submitted From</label>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={{ marginBottom: 0 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Submitted To</label>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={{ marginBottom: 0 }} />
            </div>
          </div>
        )}

        {effectiveDatePreset === "customDate" && (
          <div style={{ marginTop: 10 }}>
            <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Effective Date</label>
            <input type="date" value={effectiveCustomDate} onChange={(e) => setEffectiveCustomDate(e.target.value)} style={{ marginBottom: 0 }} />
          </div>
        )}

        {effectiveDatePreset === "customRange" && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <div style={{ flex: 1 }}>
              <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Effective From</label>
              <input type="date" value={effectiveCustomStart} onChange={(e) => setEffectiveCustomStart(e.target.value)} style={{ marginBottom: 0 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Effective To</label>
              <input type="date" value={effectiveCustomEnd} onChange={(e) => setEffectiveCustomEnd(e.target.value)} style={{ marginBottom: 0 }} />
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
              setEffectiveDatePreset("all");
              setEffectiveCustomDate("");
              setEffectiveCustomStart("");
              setEffectiveCustomEnd("");
              setAtRiskOnly(false);
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
        const draft = nextDraftInfo(d.draft_date);
        const draftSoon = draft && draft.daysUntil >= 0 && draft.daysUntil <= DRAFT_WARNING_DAYS;
        return (
          <a href={`/clients/${c.id}`} key={c.id} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card">
              <div className="row">
                <div>
                  <strong>{c.name}</strong>
                  {d.state && (
                    <span style={{ fontSize: 13, color: "#9a9a9a", fontWeight: 600, marginLeft: 8 }}>
                      {d.state}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {POLICY_STATUS_LABELS[d.policy_status] && (
                    <span className="badge" style={{ color: "var(--danger)", borderColor: "var(--danger)", background: "rgba(248,113,113,0.08)" }}>
                      {POLICY_STATUS_LABELS[d.policy_status]}
                    </span>
                  )}
                  {draftSoon && (
                    <span className="badge" style={{ color: "var(--danger)", borderColor: "var(--danger)", background: "rgba(248,113,113,0.08)" }}>
                      {draft.daysUntil === 0 ? "Drafts today" : `Drafts in ${draft.daysUntil}d`}
                    </span>
                  )}
                  <span style={{ fontSize: 13, color: "#9a9a9a" }}>{c.phone}</span>
                </div>
              </div>
              <div style={{ color: "var(--text)", fontSize: 14.5, marginTop: 6 }}>
                {d.carrier || "No carrier set"}
                {d.policy_product ? ` · ${d.policy_product}` : ""}
                {d.coverage_amount ? ` · ${formatCurrency(d.coverage_amount)} coverage` : ""}
                {d.monthly_premium ? ` · ${formatCurrency(d.monthly_premium)}/mo` : ""}
              </div>
              {d.underwriting_stage && d.underwriting_stage !== "placed" && (
                <div style={{ marginTop: 2 }}>
                  <span
                    className="badge"
                    style={
                      d.underwriting_stage === "declined"
                        ? { color: "var(--danger)", borderColor: "var(--danger)", background: "rgba(248,113,113,0.08)" }
                        : { color: "var(--gold)", borderColor: "var(--gold)", background: "rgba(201,162,39,0.08)" }
                    }
                  >
                    {UNDERWRITING_LABELS[d.underwriting_stage]}
                  </span>
                </div>
              )}
              <div style={{ color: "var(--text)", fontSize: 14.5, marginTop: 2 }}>
                Effective: {formatDate(d.effective_date) || "—"}
              </div>
              <div style={{ color: "#9a9a9a", fontSize: 13, marginTop: 2 }}>
                Submitted: {formatDate(d.application_submitted_date) || "—"}
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
