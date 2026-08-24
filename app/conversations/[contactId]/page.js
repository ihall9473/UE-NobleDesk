"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ThreadPage() {
  const { contactId } = useParams();
  const [contact, setContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState([]);

  async function load() {
    const res = await fetch(`/api/messages/${contactId}`);
    const data = await res.json();
    setContact(data.contact);
    setMessages(data.messages || []);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000); // check for new replies every 5s
    return () => clearInterval(interval);
  }, [contactId]);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates || []));
  }, []);

  async function sendReply(e) {
    e.preventDefault();
    setSending(true);
    const res = await fetch("/api/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, message: reply }),
    });
    setSending(false);
    if (res.ok) {
      setReply("");
      load();
    }
  }

  if (!contact) return <p>Loading...</p>;

  return (
    <div>
      <a href="/conversations" style={{ color: "#c9a227" }}>&larr; Back to Conversations</a>
      <h1>{contact.name}</h1>
      <p className="subtitle">{contact.phone}</p>

      <div className="thread">
        {messages.map((m) => (
          <div key={m.id}>
            <div className={m.direction === "outbound" ? "bubble-outbound" : "bubble-inbound"}>
              {m.body}
            </div>
            <div className="timestamp" style={{ textAlign: m.direction === "outbound" ? "right" : "left" }}>
              {new Date(m.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendReply}>
        {templates.length > 0 && (
          <select
            defaultValue=""
            onChange={(e) => {
              const t = templates.find((t) => t.id === e.target.value);
              if (t) setReply(t.body);
              e.target.value = "";
            }}
          >
            <option value="" disabled>Insert a saved template...</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
        <textarea
          rows={3}
          placeholder="Type a reply..."
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          required
        />
        <button type="submit" disabled={sending}>{sending ? "Sending..." : "Send Reply"}</button>
      </form>
    </div>
  );
}
