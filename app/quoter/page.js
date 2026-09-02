"use client";
import { useEffect, useState } from "react";
import { insuranceToolkitsQuoterUrl } from "@/lib/insuranceToolkits";

export default function QuoterPage() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setProfile(d.profile))
      .catch(() => setProfile({}));
  }, []);

  if (!profile) return <p>Loading...</p>;

  if (!profile.insurance_toolkits_token) {
    return (
      <div>
        <h1>Quoter</h1>
        <div className="card">
          <h3>Connect your Insurance Toolkits account</h3>
          <p className="subtitle" style={{ marginBottom: 8 }}>
            You haven't connected your Insurance Toolkits account yet - each agent quotes through
            their own account, using their own contracted carrier rates.
          </p>
          <a href="/settings">
            <button type="button">Go to Settings</button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="row" style={{ marginBottom: 0 }}>
        <h1 style={{ marginBottom: 0 }}>Quoter</h1>
        <a href="https://app.insurancetoolkits.com" target="_blank" rel="noopener noreferrer">
          <button type="button" style={{ width: "auto", marginBottom: 0 }}>Open Full Quoter</button>
        </a>
      </div>
      <p className="subtitle">
        Your own Insurance Toolkits account - same rates and carriers as logging in directly. Need
        drug lookup, the health cheat sheet, or carrier comparison? Those aren't in this embedded
        version - use "Open Full Quoter" above to log into the full site in a new tab.
      </p>
      <iframe
        src={insuranceToolkitsQuoterUrl(profile.insurance_toolkits_token)}
        style={{ border: "none", width: "100%", height: "1100px", borderRadius: 12 }}
        title="Insurance Toolkits Quoter"
      />
    </div>
  );
}
