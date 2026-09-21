"use client";
import { useEffect, useState } from "react";
import { TEXTING_ENABLED } from "@/lib/features";
import { formatPhoneInput } from "@/lib/phoneFormat";

export default function SettingsPage() {
  return <SettingsPageInner />;
}

function SettingsPageInner() {
  const [profile, setProfile] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [toolkitsInput, setToolkitsInput] = useState("");
  const [savingToolkits, setSavingToolkits] = useState(false);

  const [personalPhone, setPersonalPhone] = useState("");
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(false);
  const [savingAlerts, setSavingAlerts] = useState(false);

  const [existingNumber, setExistingNumber] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [linking, setLinking] = useState(false);

  const [numbers, setNumbers] = useState([]);
  const [switchingTo, setSwitchingTo] = useState("");

  const [templates, setTemplates] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  async function load() {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setProfile(data.profile);
    setApiKey(data.profile?.mailchimp_api_key || "");
    setBusinessName(data.profile?.business_name || "");
    setPersonalPhone(data.profile?.personal_phone || "");
    setSmsAlertsEnabled(data.profile?.sms_alerts_enabled || false);
    setToolkitsInput(data.profile?.insurance_toolkits_token || "");
  }

  async function loadTemplates() {
    const res = await fetch("/api/templates");
    const data = await res.json();
    setTemplates(data.templates || []);
  }

  async function loadNumbers() {
    const res = await fetch("/api/numbers/mine");
    const data = await res.json();
    setNumbers(data.numbers || []);
  }

  useEffect(() => {
    load();
    if (TEXTING_ENABLED) {
      loadTemplates();
      loadNumbers();
    }
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
      body: JSON.stringify({ mailchimpApiKey: apiKey, businessName }),
    });
    setSaving(false);
    const data = await res.json();
    if (res.ok) {
      setMessage("Mailchimp account connected.");
      load();
    } else {
      setMessage(data.error);
    }
  }

  async function switchActive(phoneNumber) {
    setSwitchingTo(phoneNumber);
    setMessage("");
    const res = await fetch("/api/numbers/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    });
    const data = await res.json();
    setSwitchingTo("");
    if (res.ok) {
      setMessage(`Switched! New conversations will now send from ${phoneNumber}.`);
      load();
    } else {
      setMessage(data.error);
    }
  }

  async function removeNumber(phoneNumber) {
    if (!confirm(`Remove ${phoneNumber} from your list? This doesn't affect any past conversations, just what shows up here to send from.`)) return;
    setMessage("");
    const res = await fetch("/api/numbers/mine", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(`Removed ${phoneNumber}.`);
      load();
      loadNumbers();
    } else {
      setMessage(data.error);
    }
  }

  async function linkNumber(e) {
    e.preventDefault();
    if (profile.mailchimp_number) {
      const confirmed = confirm(
        `Switch to ${existingNumber} as your active number?\n\nNew conversations will send from this number going forward. Existing conversations keep using whichever number they've always used.`
      );
      if (!confirmed) return;
    }
    setLinking(true);
    setMessage("");
    const res = await fetch("/api/numbers/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber: existingNumber, label: newLabel }),
    });
    const data = await res.json();
    setLinking(false);
    if (res.ok) {
      setMessage(`Linked! Your texting number is ${data.phoneNumber}.`);
      setExistingNumber("");
      setNewLabel("");
      load();
      loadNumbers();
    } else {
      setMessage(data.error);
    }
  }

  async function saveToolkitsToken(e) {
    e.preventDefault();
    setSavingToolkits(true);
    setMessage("");
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insuranceToolkitsToken: toolkitsInput }),
    });
    setSavingToolkits(false);
    const data = await res.json();
    if (res.ok) {
      setMessage("Insurance Toolkits connected.");
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
        {TEXTING_ENABLED
          ? "Connect your own Mailchimp account so your texting number and message costs are billed to you directly."
          : "Connect the accounts NobleDesk uses on your behalf."}
      </p>

      {message && <p className="success">{message}</p>}

      <div className="card">
        <h3>Connect Insurance Toolkits</h3>
        <p className="subtitle" style={{ marginBottom: 8 }}>
          Powers the <a href="/quoter">Quoter</a> page with your own account's rates and carriers.
          In Insurance Toolkits, open your FEX Lite widget page and paste either your personal
          link or the widget HTML code below - either one works, we just need the token inside it.
        </p>
        <form onSubmit={saveToolkitsToken}>
          <input
            placeholder="Your FEX link or widget code from Insurance Toolkits"
            value={toolkitsInput}
            onChange={(e) => setToolkitsInput(e.target.value)}
            autoComplete="off"
          />
          <button type="submit" disabled={savingToolkits}>{savingToolkits ? "Saving..." : "Save"}</button>
        </form>
        {profile.insurance_toolkits_token && (
          <p className="subtitle" style={{ marginTop: 10, marginBottom: 0 }}>
            Connected - your quoter is live on the <a href="/quoter">Quoter</a> page.
          </p>
        )}
      </div>

      {TEXTING_ENABLED && (
      <>
      <div className="card">
        <h3>1. Connect your Mailchimp account</h3>
        <p className="subtitle" style={{ marginBottom: 8 }}>
          Mailchimp Transactional is the service that actually sends and receives your texts,
          billed directly to you. Here's the process:
        </p>
        <form onSubmit={saveCredentials}>
          <ol className="subtitle" style={{ paddingLeft: 20, marginBottom: 0 }}>
            <li style={{ marginBottom: 14 }}>
              In your Mailchimp account, set up Mailchimp Transactional (formerly Mandrill) with
              an Essentials plan or higher, add a text messaging credit plan, and get your SMS
              sending program approved with a sending number - this is Mailchimp's carrier
              registration process (similar to A2P/10DLC), and can take a few days to get
              approved. When it asks for a Privacy Policy and Terms of Service link, use the ones
              under <a href="#compliance-pages">section 4 below</a>.
              <br />
              If you used a business/DBA name (e.g. "Isaac Hall Insurance") anywhere during that
              registration, enter it exactly here — it gets added to your Privacy Policy and
              Terms pages so the automated check can confirm they belong to you:
              <input
                placeholder="Business name (optional), e.g. Isaac Hall Insurance"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                style={{ marginTop: 8, marginBottom: 0 }}
              />
            </li>
            <li style={{ marginBottom: 14 }}>
              Still in Mailchimp Transactional, open <strong>Webhooks</strong> and add a new one
              for SMS events, pointing at:
              <br />
              <code style={{ fontSize: 13, wordBreak: "break-all" }}>
                {typeof window !== "undefined" ? window.location.origin : ""}/api/webhook/mailchimp
              </code>
              <br />
              This is what lets replies show up in <a href="/conversations">Conversations</a> -
              unlike some providers, Mailchimp doesn't wire this up automatically.
            </li>
            <li style={{ marginBottom: 14 }}>
              In Mailchimp Transactional, open <strong>Settings → API Keys</strong>, copy your API
              key, then paste it here:
              <input
                autoComplete="off"
                placeholder="Mailchimp Transactional API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
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
        <h3>2. Your texting numbers</h3>
        <p className="subtitle" style={{ marginBottom: 8 }}>
          Mailchimp provisions your sending number as part of getting your SMS program approved -
          there's no in-app search/buy the way some other providers work. Once you have a number,
          paste it below to register it here.
        </p>
        {message && <p className={message.startsWith("Removed") || message.startsWith("Linked") || message.startsWith("Switched") ? "success" : "error"}>{message}</p>}
        {numbers.length > 0 && (
          <>
            <p className="subtitle" style={{ marginBottom: 8 }}>
              New conversations send from your active number. Existing conversations keep using
              whichever number they've always used, even after you switch.
            </p>
            {numbers.map((n) => {
              const isActive = n.phone_number === profile.mailchimp_number;
              return (
                <div className="row" key={n.phone_number} style={{ marginTop: 10 }}>
                  <span>
                    <strong>{n.label || n.phone_number}</strong>
                    {n.label && <span style={{ color: "#9a9a9a" }}> — {n.phone_number}</span>}
                    {isActive && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 10,
                          background: "rgba(201, 162, 39, 0.15)",
                          color: "#c9a227",
                        }}
                      >
                        Active
                      </span>
                    )}
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {!isActive && (
                      <button onClick={() => switchActive(n.phone_number)} disabled={switchingTo === n.phone_number}>
                        {switchingTo === n.phone_number ? "Switching..." : "Set Active"}
                      </button>
                    )}
                    <button onClick={() => removeNumber(n.phone_number)} style={{ background: "#dc2626" }}>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        <p className="subtitle" style={{ marginTop: 18, marginBottom: 8 }}>
          {numbers.length > 0
            ? "Add another number from your Mailchimp account (e.g. one for a separate program):"
            : "Add your sending number from Mailchimp:"}
        </p>
        <form onSubmit={linkNumber} style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Your number, e.g. +15551234567"
            value={existingNumber}
            onChange={(e) => setExistingNumber(e.target.value)}
            style={{ marginBottom: 0 }}
          />
          <input
            placeholder="Label (optional), e.g. Campaign 2"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            style={{ marginBottom: 0 }}
          />
          <button type="submit" disabled={linking}>{linking ? "Adding..." : "Add"}</button>
        </form>
      </div>

      <div className="card">
        <h3>3. Text alerts to your personal cell (optional)</h3>
        <p className="subtitle" style={{ marginBottom: 8 }}>
          Get an actual text message on your personal phone whenever a lead or client texts
          back — separate from the app's own notifications. This sends an extra text each time
          (charged to your Mailchimp account, roughly a cent per alert).
        </p>
        <form onSubmit={saveAlerts}>
          <input
            placeholder="Your personal cell number"
            value={personalPhone}
            onChange={(e) => setPersonalPhone(formatPhoneInput(e.target.value))}
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
        <h3>4. Your compliance pages (for Mailchimp registration)</h3>
        <p className="subtitle" style={{ marginBottom: 8 }}>
          Use these links when Mailchimp's SMS program approval form asks for a Privacy Policy,
          Terms of Service, or a Call to Action (CTA) / opt-in page - they automatically show your
          own name and number, nothing to edit. If your program gets rejected over the CTA, use
          the Request Info link below as the CTA URL - it's a real, live page showing exactly how
          someone opts in (name, phone, and a consent checkbox), which is what the review needs to
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
                Request Info Page (opt-in CTA for Mailchimp)
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
      </>
      )}
    </div>
  );
}
