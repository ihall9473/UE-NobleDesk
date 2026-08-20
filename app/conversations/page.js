"use client";
import { useEffect, useState } from "react";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => {
        setConversations(d.conversations || []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1>Conversations</h1>
      <p className="subtitle">Tap a person to see the full text thread and reply.</p>

      {loading && <p>Loading...</p>}
      {!loading && conversations.length === 0 && (
        <p className="subtitle">No conversations yet. Send your first text from the Compose page.</p>
      )}

      {conversations.map((c) => (
        <a href={`/conversations/${c.id}`} key={c.id} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card">
            <div className="row">
              <strong>
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
              <span style={{ fontSize: 12, color: "#999" }}>
                {new Date(c.lastMessage.created_at).toLocaleString()}
              </span>
            </div>
            <div style={{ color: "#666", marginTop: 4 }}>
              {c.lastMessage.direction === "outbound" ? "You: " : ""}
              {c.lastMessage.body}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
