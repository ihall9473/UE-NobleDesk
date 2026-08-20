"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ThreadPage() {
  const { contactId } = useParams();
  const [contact, setContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

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
      <a href="/conversations" style={{ color: "#4f46e5" }}>&larr; Back to Conversations</a>
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
