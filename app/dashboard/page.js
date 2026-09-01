"use client";
import { useEffect, useState } from "react";
import { formatCurrency, parseCurrency } from "@/lib/formatCurrency";

export default function DashboardPage() {
  const [clients, setClients] = useState(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((d) => setClients(d.clients || []));
  }, []);

  if (!clients) return <p>Loading...</p>;

  // "In force" = still active - lapsed/chargeback/cancelled policies are
  // no longer paying premium or covering anyone, so they don't belong in
  // a book-of-business valuation.
  const inForce = clients.filter((c) => (c.client_details?.policy_status || "active") === "active");

  const totalMonthlyPremium = inForce.reduce(
    (sum, c) => sum + parseCurrency(c.client_details?.monthly_premium),
    0
  );
  const totalDeathBenefit = inForce.reduce(
    (sum, c) => sum + parseCurrency(c.client_details?.coverage_amount),
    0
  );
  const policiesWithCoverage = inForce.filter((c) => c.client_details?.coverage_amount).length;
  const averagePolicySize = policiesWithCoverage > 0 ? totalDeathBenefit / policiesWithCoverage : 0;
  const notInForceCount = clients.length - inForce.length;

  return (
    <div>
      <h1>Book of Business</h1>
      <p className="subtitle">
        A snapshot of your in-force policies - useful for your own planning, or if you ever sell
        your book to another agent.
      </p>

      <div className="card">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{inForce.length}</div>
            <div className="subtitle" style={{ marginBottom: 0 }}>Policies In Force</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{formatCurrency(totalMonthlyPremium * 12)}</div>
            <div className="subtitle" style={{ marginBottom: 0 }}>Total In-Force Premium (Annual)</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{formatCurrency(totalDeathBenefit)}</div>
            <div className="subtitle" style={{ marginBottom: 0 }}>Total Death Benefit In Force</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{formatCurrency(averagePolicySize)}</div>
            <div className="subtitle" style={{ marginBottom: 0 }}>Average Policy Size</div>
          </div>
        </div>
      </div>

      {notInForceCount > 0 && (
        <p className="subtitle">
          {notInForceCount} polic{notInForceCount === 1 ? "y" : "ies"} excluded (lapsed, chargeback,
          or cancelled) - see the <a href="/clients">Clients</a> page to review them.
        </p>
      )}
    </div>
  );
}
