"use client";
import { useEffect, useState } from "react";
import { CARRIERS, PHONE_CATEGORIES } from "@/lib/carriers";

export default function CarriersPage() {
  const [logins, setLogins] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [savedId, setSavedId] = useState("");

  useEffect(() => {
    fetch("/api/carrier-logins")
      .then((res) => res.json())
      .then((data) => {
        setLogins(data.logins || {});
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
                Phone Numbers
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                {PHONE_CATEGORIES.map((cat) => (
                  <div key={cat.key}>
                    <div className="subtitle" style={{ marginBottom: 2, fontSize: 13 }}>{cat.label}</div>
                    <a href={`tel:${carrier.phones[cat.key].replace(/[^\d+]/g, "")}`} style={{ fontWeight: 600 }}>
                      {carrier.phones[cat.key]}
                    </a>
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
