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
      <h1>Quoter</h1>
      <p className="subtitle">Your own Insurance Toolkits account - same rates and carriers as logging in directly.</p>
      <iframe
        src={insuranceToolkitsQuoterUrl(profile.insurance_toolkits_token)}
        style={{ border: "none", width: "100%", height: "1100px", borderRadius: 12 }}
        title="Insurance Toolkits Quoter"
      />
    </div>
  );
}
