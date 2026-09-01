"use client";
import { useEffect, useState } from "react";
import { CARRIERS, PHONE_CATEGORIES } from "@/lib/carriers";

export default function CarriersPage() {
  const [logins, setLogins] = useState({});
  const [compRates, setCompRates] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [savedId, setSavedId] = useState("");
  const [savingCompId, setSavingCompId] = useState("");
  const [savedCompId, setSavedCompId] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/carrier-logins").then((res) => res.json()),
      fetch("/api/carrier-comp").then((res) => res.json()),
    ]).then(([loginData, compData]) => {
      setLogins(loginData.logins || {});
      setCompRates(compData.rates || {});
      setLoaded(true);
    });
  }, []);

  function setField(carrierId, field, value) {
    setLogins((prev) => ({
      ...prev,
      [carrierId]: { ...(prev[carrierId] || { username: "", password: "" }), [field]: value },
    }));
  }

  async function save(carrierId) {
    setSavingId(carrierId);
    setSavedId("");
    const login = logins[carrierId] || { username: "", password: "" };
    const res = await fetch("/api/carrier-logins", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ carrierId, username: login.username, password: login.password }),
    });
    setSavingId("");
    if (res.ok) {
      setSavedId(carrierId);
      setTimeout(() => setSavedId(""), 2000);
    }
  }

  async function saveCompRate(carrierId) {
    setSavingCompId(carrierId);
    setSavedCompId("");
    const res = await fetch("/api/carrier-comp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ carrierId, compPercentage: compRates[carrierId] || 0 }),
    });
    setSavingCompId("");
    if (res.ok) {
      setSavedCompId(carrierId);
      setTimeout(() => setSavedCompId(""), 2000);
    }
  }

  return (
    <div>
      <h1>Carriers</h1>
      <p className="subtitle">
        Login info and phone numbers for the carriers you write business with. Login info is
        never hidden here - only your Clients page masks sensitive fields.
      </p>

      {!loaded && <p className="subtitle">Loading...</p>}

      {loaded &&
        CARRIERS.map((carrier) => {
          const login = logins[carrier.id] || { username: "", password: "" };
          return (
            <div className="card" key={carrier.id}>
              <div className="row" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img
                    src={`https://www.google.com/s2/favicons?sz=64&domain=${carrier.domain}`}
                    alt=""
                    width={32}
                    height={32}
                    style={{ borderRadius: 6, background: "#fff" }}
                  />
                  <h3 style={{ margin: 0 }}>{carrier.name}</h3>
                </div>
              </div>

              <label className="label-caps" style={{ display: "block", marginBottom: 8 }}>
                Login Info
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  placeholder="Username"
                  value={login.username}
                  onChange={(e) => setField(carrier.id, "username", e.target.value)}
                  autoComplete="off"
                  style={{ flex: 1, minWidth: 160 }}
                />
                {carrier.passwordNote ? (
                  <div
                    style={{ flex: 1, minWidth: 160, display: "flex", alignItems: "center", color: "var(--gold)", fontSize: 14, fontWeight: 600 }}
                  >
                    {carrier.passwordNote}
                  </div>
                ) : (
                  <input
                    placeholder="Password"
                    value={login.password}
                    onChange={(e) => setField(carrier.id, "password", e.target.value)}
                    autoComplete="off"
                    style={{ flex: 1, minWidth: 160 }}
                  />
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => save(carrier.id)}
                  disabled={savingId === carrier.id}
                  style={{ marginBottom: 0 }}
                >
                  {savingId === carrier.id ? "Saving..." : savedId === carrier.id ? "Saved" : "Save Login Info"}
                </button>
                {carrier.loginHint && (
                  <span className="subtitle" style={{ marginBottom: 0, color: "var(--gold)", fontWeight: 600, fontSize: 13.5 }}>
                    {carrier.loginHint}
                  </span>
                )}
              </div>

              <label className="label-caps" style={{ display: "block", marginBottom: 8 }}>
                Your Comp %
              </label>
              <p className="subtitle" style={{ marginTop: -4, marginBottom: 8 }}>
                Your own negotiated commission rate with this carrier, as a % of annual premium.
                Used to estimate your expected payout on My Team.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="e.g. 80"
                  value={compRates[carrier.id] ?? ""}
                  onChange={(e) =>
                    setCompRates((prev) => ({ ...prev, [carrier.id]: e.target.value }))
                  }
                  style={{ maxWidth: 120, marginBottom: 0 }}
                />
                <span className="subtitle" style={{ marginBottom: 0 }}>%</span>
                <button
                  type="button"
                  onClick={() => saveCompRate(carrier.id)}
                  disabled={savingCompId === carrier.id}
                  style={{ marginBottom: 0, width: "auto" }}
                >
                  {savingCompId === carrier.id
                    ? "Saving..."
                    : savedCompId === carrier.id
                    ? "Saved"
                    : "Save Comp %"}
                </button>
              </div>

              <label className="label-caps" style={{ display: "block", marginBottom: 8 }}>
                Phone Numbers
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                {PHONE_CATEGORIES.map((cat) => (
                  <div key={cat.key}>
                    <div className="subtitle" style={{ marginBottom: 2, fontSize: 13 }}>{cat.label}</div>
                    {/\d/.test(carrier.phones[cat.key]) ? (
                      <a href={`tel:${carrier.phones[cat.key].replace(/[^\d+]/g, "")}`} style={{ fontWeight: 600 }}>
                        {carrier.phones[cat.key]}
                      </a>
                    ) : (
                      <span style={{ fontWeight: 600 }}>{carrier.phones[cat.key]}</span>
                    )}
                    {carrier.emails?.[cat.key] && (
                      <div>
                        <a href={`mailto:${carrier.emails[cat.key]}`} style={{ fontSize: 12.5 }}>
                          {carrier.emails[cat.key]}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
                {carrier.extraPhones?.map((extra) => (
                  <div key={extra.label}>
                    <div className="subtitle" style={{ marginBottom: 2, fontSize: 13 }}>{extra.label}</div>
                    <a href={`tel:${extra.value.replace(/[^\d+]/g, "")}`} style={{ fontWeight: 600 }}>
                      {extra.value}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
