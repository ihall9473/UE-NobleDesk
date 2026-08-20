"use client";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [sid, setSid] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [areaCode, setAreaCode] = useState("");
  const [available, setAvailable] = useState([]);
  const [searching, setSearching] = useState(false);
  const [buying, setBuying] = useState("");

  async function load() {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setProfile(data.profile);
    setSid(data.profile?.twilio_account_sid || "");
  }

  useEffect(() => {
    load();
  }, []);

  async function saveCredentials(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ twilioAccountSid: sid, twilioAuthToken: token }),
    });
    setSaving(false);
    const data = await res.json();
    if (res.ok) {
      setMessage("Twilio account connected.");
      setToken("");
      load();
    } else {
      setMessage(data.error);
    }
  }

  async function searchNumbers(e) {
    e.preventDefault();
    setSearching(true);
    setAvailable([]);
    setMessage("");
    const res = await fetch(`/api/numbers?areaCode=${areaCode}`);
    const data = await res.json();
    setSearching(false);
    if (res.ok) setAvailable(data.numbers);
    else setMessage(data.error);
  }

  async function buyNumber(phoneNumber) {
    setBuying(phoneNumber);
    const res = await fetch("/api/numbers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    });
    const data = await res.json();
    setBuying("");
    if (res.ok) {
      setMessage(`You're all set! Your texting number is ${data.phoneNumber}.`);
      setAvailable([]);
      load();
    } else {
      setMessage(data.error);
    }
  }

  if (!profile) return <p>Loading...</p>;

  return (
    <div>
      <h1>Your Settings</h1>
      <p className="subtitle">
        Connect your own Twilio account so your texting number and message costs are billed to you directly.
      </p>

      {message && <p className="success">{message}</p>}

      <div className="card">
        <h3>1. Connect your Twilio account</h3>
        <p className="subtitle" style={{ marginBottom: 8 }}>
          Don't have one yet? Sign up free at twilio.com, add a payment method, then copy your
          Account SID and Auth Token from the Console and paste them below.
        </p>
        <form onSubmit={saveCredentials}>
          <input
            placeholder="Twilio Account SID (starts with AC...)"
            value={sid}
            onChange={(e) => setSid(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder={profile.hasAuthToken ? "Auth Token (already saved - leave blank to keep it)" : "Auth Token"}
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        </form>
      </div>

      <div className="card">
        <h3>2. Get your texting number</h3>
        {profile.twilio_number ? (
          <p>Your current number: <strong>{profile.twilio_number}</strong></p>
        ) : (
          <p className="subtitle" style={{ marginBottom: 8 }}>
            Search by area code and buy a number — charged to your own Twilio account.
          </p>
        )}
        <form onSubmit={searchNumbers} style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Area code, e.g. 216"
            value={areaCode}
            onChange={(e) => setAreaCode(e.target.value)}
            style={{ marginBottom: 0 }}
          />
          <button type="submit" disabled={searching}>{searching ? "Searching..." : "Search"}</button>
        </form>
        {available.map((n) => (
          <div className="row" key={n.phoneNumber} style={{ marginTop: 10 }}>
            <span>{n.phoneNumber}</span>
            <button onClick={() => buyNumber(n.phoneNumber)} disabled={buying === n.phoneNumber}>
              {buying === n.phoneNumber ? "Buying..." : "Buy"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
