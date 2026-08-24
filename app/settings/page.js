"use client";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [sid, setSid] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [personalPhone, setPersonalPhone] = useState("");
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(false);
  const [savingAlerts, setSavingAlerts] = useState(false);

  const [areaCode, setAreaCode] = useState("");
  const [available, setAvailable] = useState([]);
  const [searching, setSearching] = useState(false);
  const [buying, setBuying] = useState("");

  async function load() {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setProfile(data.profile);
    setSid(data.profile?.twilio_account_sid || "");
    setPersonalPhone(data.profile?.personal_phone || "");
    setSmsAlertsEnabled(data.profile?.sms_alerts_enabled || false);
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
    const confirmed = confirm(
      `Buy ${phoneNumber}?\n\nThis charges your own Twilio account roughly $1.15/month for the number, plus about a penny per text sent or received going forward.\n\nThis can't be undone from here — click OK only if you're sure.`
    );
    if (!confirmed) return;

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

  async function saveAlerts(e) {
    e.preventDefault();
    setSavingAlerts(true);
    setMessage("");
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personalPhone, smsAlertsEnabled }),
    });
    setSavingAlerts(false);
    const data = await res.json();
    if (res.ok) {
      setMessage("Alert preferences saved.");
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
          Twilio is the service that actually sends and receives your texts, billed directly to
          you. Here's the full process, step by step:
        </p>
        <ol className="subtitle" style={{ paddingLeft: 20, marginBottom: 16 }}>
          <li style={{ marginBottom: 8 }}>
            Go to{" "}
            <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer">
              twilio.com/try-twilio
            </a>{" "}
            and create a free account.
          </li>
          <li style={{ marginBottom: 8 }}>
            In the Twilio Console, add a payment method — your own card, since Twilio bills you
            directly and not NobleDesk.
          </li>
          <li style={{ marginBottom: 8 }}>
            Go to <strong>Messaging → Regulatory Compliance → A2P 10DLC</strong> and register
            your business info. This is required before you can send real texting volume, and
            can take a few days to a couple weeks to get approved. When it asks for a Privacy
            Policy and Terms of Service link, use the ones under{" "}
            <strong>section 4 below</strong>.
          </li>
          <li style={{ marginBottom: 8 }}>
            Back on the Twilio Console home page, copy your <strong>Account SID</strong> and{" "}
            <strong>Auth Token</strong>.
          </li>
          <li>Paste them into the fields below and click Save.</li>
        </ol>
        <form onSubmit={saveCredentials}>
          <input
            placeholder="Twilio Account SID (starts with AC...)"
            value={sid}
            onChange={(e) => setSid(e.target.value)}
            autoComplete="off"
            required
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder={profile.hasAuthToken ? "Auth Token (already saved - leave blank to keep it)" : "Auth Token"}
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        </form>
      </div>

      <div className="card">
        <h3>2. Buy your texting number (final step)</h3>
        {profile.twilio_number ? (
          <p>
            Your current number: <strong>{profile.twilio_number}</strong> — you're fully linked
            up and ready to send and receive texts through NobleDesk.
          </p>
        ) : (
          <p className="subtitle" style={{ marginBottom: 8 }}>
            Search by area code and click Buy. This is what actually links your Twilio account
            to NobleDesk — once you have a number, you're all set. It's charged to your own
            Twilio account (about $1.15/month, plus roughly a penny per text).
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

      <div className="card">
        <h3>3. Text alerts to your personal cell (optional)</h3>
        <p className="subtitle" style={{ marginBottom: 8 }}>
          Get an actual text message on your personal phone whenever a lead or client texts
          back — separate from the app's own notifications. This sends an extra text each time
          (charged to your Twilio account, roughly a cent per alert).
        </p>
        <form onSubmit={saveAlerts}>
          <input
            placeholder="Your personal cell number"
            value={personalPhone}
            onChange={(e) => setPersonalPhone(e.target.value)}
          />
          <div className="checkbox-row">
            <input
              type="checkbox"
              checked={smsAlertsEnabled}
              onChange={(e) => setSmsAlertsEnabled(e.target.checked)}
            />
            <span>Text me when someone replies</span>
          </div>
          <button type="submit" disabled={savingAlerts}>{savingAlerts ? "Saving..." : "Save"}</button>
        </form>
      </div>
      <div className="card">
        <h3>4. Your compliance pages (for Twilio registration)</h3>
        <p className="subtitle" style={{ marginBottom: 8 }}>
          Use these links when Twilio's A2P 10DLC form asks for a Privacy Policy and Terms of
          Service - they automatically show your own name and number, nothing to edit.
        </p>
        {typeof window !== "undefined" && (
          <>
            <div style={{ marginBottom: 10 }}>
              <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Privacy Policy</label>
              <div className="row">
                <code style={{ fontSize: 13, wordBreak: "break-all" }}>
                  {window.location.origin}/privacy/{profile.id}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/privacy/${profile.id}`);
                    setMessage("Privacy Policy link copied.");
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
            <div>
              <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>Terms of Service</label>
              <div className="row">
                <code style={{ fontSize: 13, wordBreak: "break-all" }}>
                  {window.location.origin}/terms/{profile.id}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/terms/${profile.id}`);
                    setMessage("Terms of Service link copied.");
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
