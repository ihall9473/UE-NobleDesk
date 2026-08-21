"use client";
import { useState } from "react";

export default function RequestInfoForm({ userId, agentName }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/request-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name, phone, consent }),
    });
    setLoading(false);
    if (res.ok) {
      setSubmitted(true);
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div className="card">
        <p className="success" style={{ marginBottom: 0 }}>
          Thanks, {name.split(" ")[0]}! {agentName} will be in touch with you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      {error && <p className="error">{error}</p>}
      <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input placeholder="Your phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />

      <div className="checkbox-row" style={{ alignItems: "flex-start" }}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          style={{ marginTop: 4 }}
        />
        <span style={{ fontSize: 13, color: "#9a9a9a", lineHeight: 1.5 }}>
          By checking this box, I agree to receive text messages from {agentName} regarding my
          insurance inquiry. Message frequency varies. Message and data rates may apply. Reply
          STOP to opt out at any time. See{" "}
          <a href={`/privacy/${userId}`} target="_blank" rel="noopener noreferrer">Privacy Policy</a>{" "}
          and{" "}
          <a href={`/terms/${userId}`} target="_blank" rel="noopener noreferrer">Terms of Service</a>.
        </span>
      </div>

      <button type="submit" disabled={loading || !consent}>
        {loading ? "Submitting..." : "Request Info"}
      </button>
    </form>
  );
}
