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

  const [templates, setTemplates] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  async function load() {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setProfile(data.profile);
    setSid(data.profile?.twilio_account_sid || "");
    setPersonalPhone(data.profile?.personal_phone || "");
    setSmsAlertsEnabled(data.profile?.sms_alerts_enabled || false);
  }

  async function loadTemplates() {
    const res = await fetch("/api/templates");
    const data = await res.json();
    setTemplates(data.templates || []);
  }

  useEffect(() => {
    load();
    loadTemplates();
  }, []);

  async function addTemplate(e) {
    e.preventDefault();
    setSavingTemplate(true);
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: templateName, body: templateBody }),
    });
    setSavingTemplate(false);
    const data = await res.json();
    if (res.ok) {
      setTemplateName("");
      setTemplateBody("");
      loadTemplates();
    } else {
      setMessage(data.error || "Something went wrong.");
    }
  }

  async function updateTemplateBody(template, body) {
    if (body === template.body) return;
    await fetch("/api/templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: template.id, body }),
    });
  }

  async function removeTemplate(id) {
    if (!confirm("Delete this template?")) return;
    await fetch("/api/templates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadTemplates();
  }

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
        <form onSubmit={saveCredentials}>
          <ol className="subtitle" style={{ paddingLeft: 20, marginBottom: 0 }}>
            <li style={{ marginBottom: 14 }}>
              Go to{" "}
              <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer">
                twilio.com/try-twilio
              </a>{" "}
              and create a free account.
            </li>
            <li style={{ marginBottom: 14 }}>
              In the{" "}
              <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer">
                Twilio Console
              </a>
              , open <strong>Billing</strong> in the left-hand menu and add a payment method —
              your own card, since Twilio bills you directly and not NobleDesk.
            </li>
            <li style={{ marginBottom: 14 }}>
              Still in the{" "}
              <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer">
                Twilio Console
              </a>
              , go to <strong>Messaging → Regulatory Compliance → A2P 10DLC</strong> and register
              your business info. This is required before you can send real texting volume, and
              can take a few days to a couple weeks to get approved. When it asks for a Privacy
              Policy and Terms of Service link, use the ones under{" "}
              <a href="#compliance-pages">section 4 below</a>.
            </li>
            <li style={{ marginBottom: 14 }}>
              On the{" "}
              <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer">
                Twilio Console home page
              </a>
              , copy your <strong>Account SID</strong> (starts with "AC"), then paste it here:
              <input
                placeholder="Twilio Account SID (starts with AC...)"
                value={sid}
                onChange={(e) => setSid(e.target.value)}
                autoComplete="off"
                required
                style={{ marginTop: 8, marginBottom: 0 }}
              />
            </li>
            <li style={{ marginBottom: 14 }}>
              On that same page, click "show" to reveal your <strong>Auth Token</strong>, copy
              it, then paste it here:
              <input
                type="password"
                autoComplete="new-password"
                placeholder={profile.hasAuthToken ? "Auth Token (already saved - leave blank to keep it)" : "Auth Token"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                style={{ marginTop: 8, marginBottom: 0 }}
              />
            </li>
          </ol>
          <button type="submit" disabled={saving} style={{ marginTop: 6 }}>
            {saving ? "Saving..." : "Save"}
          </button>
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
      <div className="card" id="compliance-pages">
        <h3>4. Your compliance pages (for Twilio registration)</h3>
        <p className="subtitle" style={{ marginBottom: 8 }}>
          Use these links when Twilio's A2P 10DLC form asks for a Privacy Policy, Terms of
          Service, or a Call to Action (CTA) / opt-in page - they automatically show your own
          name and number, nothing to edit. If Twilio rejects a campaign over the CTA, use the
          Request Info link below as the CTA URL - it's a real, live page showing exactly how
          someone opts in (name, phone, and a consent checkbox), which is what Twilio needs to
          be able to verify.
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
            <div style={{ marginTop: 10 }}>
              <label className="subtitle" style={{ display: "block", marginBottom: 4 }}>
                Request Info Page (opt-in CTA for Twilio)
              </label>
              <div className="row">
                <code style={{ fontSize: 13, wordBreak: "break-all" }}>
                  {window.location.origin}/request-info/{profile.id}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/request-info/${profile.id}`);
                    setMessage("Request Info link copied.");
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h3>5. Message templates</h3>
        <p className="subtitle" style={{ marginBottom: 8 }}>
          Save reusable messages - like a follow-up after a missed call, or a quote check-in -
          so you can pick them from a dropdown on Send a Text and in a conversation reply
          instead of retyping them every time.
        </p>
        {templates && templates.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            {templates.map((t) => (
              <div key={t.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="row" style={{ marginBottom: 6 }}>
                  <strong style={{ fontSize: 14 }}>{t.name}</strong>
                  <button
                    type="button"
                    onClick={() => removeTemplate(t.id)}
                    style={{ width: "auto", marginBottom: 0, background: "#dc2626", padding: "4px 12px", fontSize: 12 }}
                  >
                    Delete
                  </button>
                </div>
                <textarea
                  rows={2}
                  defaultValue={t.body}
                  onBlur={(e) => updateTemplateBody(t, e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
            ))}
          </div>
        )}
        <form onSubmit={addTemplate}>
          <input
            placeholder="Template name, e.g. Missed Call Follow-up"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            required
          />
          <textarea
            rows={3}
            placeholder="Message text... use {first_name} or {name} if you want it filled in automatically"
            value={templateBody}
            onChange={(e) => setTemplateBody(e.target.value)}
            required
          />
          <button type="submit" disabled={savingTemplate}>{savingTemplate ? "Saving..." : "Save Template"}</button>
        </form>
      </div>
    </div>
  );
}
