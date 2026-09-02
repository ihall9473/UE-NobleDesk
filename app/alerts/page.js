"use client";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/formatCurrency";

function AlertCard({ title, color, description, empty, children }) {
  return (
    <div className="card" style={{ background: `rgba(${color}, 0.06)`, border: `1px solid rgba(${color}, 0.35)` }}>
      <div className="label-caps" style={{ color: `rgb(${color})` }}>{title}</div>
      <p className="subtitle" style={{ marginTop: 4, marginBottom: 8 }}>{description}</p>
      {children}
      {empty && <p className="subtitle" style={{ marginBottom: 0 }}>Nothing to flag right now.</p>}
    </div>
  );
}

const DANGER_RGB = "248, 113, 113";
const GOLD_RGB = "201, 162, 39";

export default function AlertsPage() {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/alerts");
    const d = await res.json();
    if (d.error) setMessage(d.error);
    else setData(d);
  }

  useEffect(() => {
    load();
  }, []);

  async function markReviewed(contactId) {
    await fetch(`/api/clients/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markBeneficiariesReviewed: true }),
    });
    load();
  }

  if (message) return <p className="error">{message}</p>;
  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <h1>Policy Alerts</h1>
      <p className="subtitle">Everything on your book that needs attention, in one place.</p>

      <div className="card" style={{ background: "rgba(201, 162, 39, 0.06)", border: "1px solid rgba(201, 162, 39, 0.35)" }}>
        <div className="row">
          <div>
            <div className="label-caps">Persistency Rate</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>
              {data.persistencyRate === null ? "—" : `${data.persistencyRate.toFixed(1)}%`}
            </div>
          </div>
          <div style={{ textAlign: "right", color: "#9a9a9a", fontSize: 13 }}>
            {data.activePolicyCount} active of {data.placedPolicyCount} ever placed
          </div>
        </div>
      </div>

      <AlertCard
        title="Upcoming Premium Drafts"
        color={DANGER_RGB}
        description="Get ahead of an NSF or lapse before it drafts."
        empty={data.upcomingDrafts.length === 0}
      >
        {data.upcomingDrafts.map(({ client, daysUntil }) => (
          <a key={client.id} href={`/clients/${client.id}`} style={{ display: "block", textDecoration: "none", color: "inherit", fontSize: 14, marginBottom: 4 }}>
            <strong>{client.name}</strong>{" "}
            <span style={{ color: "#9a9a9a" }}>
              — {daysUntil === 0 ? "drafts today" : `drafts in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`}
              {client.client_details?.monthly_premium ? ` (${formatCurrency(client.client_details.monthly_premium)})` : ""}
            </span>
          </a>
        ))}
      </AlertCard>

      <AlertCard
        title="Upcoming Term Conversion Deadlines"
        color={GOLD_RGB}
        description="Miss one of these and the client loses the option to convert for good."
        empty={data.upcomingConversions.length === 0}
      >
        {data.upcomingConversions.map(({ client, daysUntil }) => (
          <a key={client.id} href={`/clients/${client.id}`} style={{ display: "block", textDecoration: "none", color: "inherit", fontSize: 14, marginBottom: 4 }}>
            <strong>{client.name}</strong>{" "}
            <span style={{ color: "#9a9a9a" }}>— {daysUntil === 0 ? "deadline is today" : `${daysUntil} day${daysUntil === 1 ? "" : "s"} left to convert`}</span>
          </a>
        ))}
      </AlertCard>

      <AlertCard
        title="Upcoming Policy Anniversaries"
        color={GOLD_RGB}
        description="A good excuse to check in and look for cross-sell/referral opportunities."
        empty={data.upcomingAnniversaries.length === 0}
      >
        {data.upcomingAnniversaries.map(({ client, daysUntil, years }) => (
          <a key={client.id} href={`/clients/${client.id}`} style={{ display: "block", textDecoration: "none", color: "inherit", fontSize: 14, marginBottom: 4 }}>
            <strong>{client.name}</strong>{" "}
            <span style={{ color: "#9a9a9a" }}>
              — {years}-year anniversary {daysUntil === 0 ? "is today" : `in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`}
            </span>
          </a>
        ))}
      </AlertCard>

      <AlertCard
        title="At-Risk Policies"
        color={DANGER_RGB}
        description="Lapsed or chargeback status - commission clawback risk."
        empty={data.atRiskPolicies.length === 0}
      >
        {data.atRiskPolicies.map((client) => (
          <a key={client.id} href={`/clients/${client.id}`} style={{ display: "block", textDecoration: "none", color: "inherit", fontSize: 14, marginBottom: 4 }}>
            <strong>{client.name}</strong>{" "}
            <span style={{ color: "#9a9a9a", textTransform: "capitalize" }}>— {client.client_details?.policy_status}</span>
          </a>
        ))}
      </AlertCard>

      <AlertCard
        title="Beneficiary Review Needed"
        color={GOLD_RGB}
        description="No beneficiaries on file, or not reviewed in over a year."
        empty={data.beneficiaryReviewNeeded.length === 0}
      >
        {data.beneficiaryReviewNeeded.map((client) => (
          <div key={client.id} className="row" style={{ marginBottom: 6 }}>
            <a href={`/clients/${client.id}`} style={{ textDecoration: "none", color: "inherit", fontSize: 14 }}>
              <strong>{client.name}</strong>
            </a>
            <button type="button" onClick={() => markReviewed(client.id)} style={{ width: "auto", marginBottom: 0, fontSize: 12, padding: "4px 10px" }}>
              Mark Reviewed
            </button>
          </div>
        ))}
      </AlertCard>

      <AlertCard
        title="Neglected Policies"
        color={GOLD_RGB}
        description="No contact logged (note, call, or text) in 180+ days."
        empty={data.neglectedPolicies.length === 0}
      >
        {data.neglectedPolicies.map(({ client, daysSinceTouch }) => (
          <a key={client.id} href={`/clients/${client.id}`} style={{ display: "block", textDecoration: "none", color: "inherit", fontSize: 14, marginBottom: 4 }}>
            <strong>{client.name}</strong>{" "}
            <span style={{ color: "#9a9a9a" }}>
              — {daysSinceTouch === Infinity ? "never contacted" : `${daysSinceTouch} days since last contact`}
            </span>
          </a>
        ))}
      </AlertCard>

      <AlertCard
        title="Recent Life Events"
        color={GOLD_RGB}
        description="Logged in the last 30 days - worth a coverage/beneficiary review."
        empty={data.lifeEvents.length === 0}
      >
        {data.lifeEvents.map((e, i) => (
          <a key={i} href={`/clients/${e.client.id}`} style={{ display: "block", textDecoration: "none", color: "inherit", fontSize: 14, marginBottom: 4 }}>
            <strong>{e.client.name}</strong> <span style={{ color: "#9a9a9a" }}>— {e.body}</span>
          </a>
        ))}
      </AlertCard>
    </div>
  );
}
