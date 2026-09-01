"use client";
import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/formatDate";
import { TEXTING_ENABLED } from "@/lib/features";
import FeatureDisabled from "@/app/components/FeatureDisabled";

export default function ConversationsPage() {
  if (!TEXTING_ENABLED) return <FeatureDisabled />;
  return <ConversationsPageInner />;
}

function ConversationsPageInner() {
  const [conversations, setConversations] = useState([]);
  const [numbers, setNumbers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => {
        setConversations(d.conversations || []);
        setLoading(false);
      });
    fetch("/api/numbers/mine")
      .then((r) => r.json())
      .then((d) => setNumbers(d.numbers || []));
  }, []);

  function numberLabel(phoneNumber) {
    const n = numbers.find((n) => n.phone_number === phoneNumber);
    return n?.label || phoneNumber;
  }

  const visible =
    filter === "all" ? conversations : conversations.filter((c) => c.twilio_number === filter);

  return (
    <div>
      <h1>Conversations</h1>
      <p className="subtitle">Tap a person to see the full text thread and reply.</p>

      {numbers.length > 1 && (
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ marginBottom: 16 }}>
          <option value="all">All numbers</option>
          {numbers.map((n) => (
            <option key={n.phone_number} value={n.phone_number}>
              {n.label || n.phone_number}
            </option>
          ))}
        </select>
      )}

      {loading && <p>Loading...</p>}
      {!loading && visible.length === 0 && (
        <p className="subtitle">No conversations yet. Send your first text from the Compose page.</p>
      )}

      {visible.map((c) => (
        <a href={`/conversations/${c.id}`} key={c.id} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card" style={{ background: "#f5f5f5", border: "1px solid #ddd" }}>
            <div className="row">
              <strong style={{ color: "#0e0e0f" }}>
                {c.name}{" "}
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 10,
                    background: c.type === "client" ? "#d1fae5" : "#fef3c7",
                    color: c.type === "client" ? "#065f46" : "#92400e",
                  }}
                >
                  {c.type === "client" ? "Client" : "Lead"}
                </span>
              </strong>
              <span style={{ fontSize: 12, color: "#666" }}>
                {formatDateTime(c.lastMessage.created_at)}
              </span>
            </div>
            <div style={{ color: "#444", marginTop: 4 }}>
              {c.lastMessage.direction === "outbound" ? "You: " : ""}
              {c.lastMessage.body}
            </div>
            {numbers.length > 1 && c.twilio_number && (
              <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                via {numberLabel(c.twilio_number)}
              </div>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}
