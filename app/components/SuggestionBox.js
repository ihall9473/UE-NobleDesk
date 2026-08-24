"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function SuggestionBox() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (
    pathname === "/login" ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/set-password") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms")
  ) {
    return null;
  }

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    setError("");
    const res = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    setSending(false);
    if (res.ok) {
      setText("");
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setOpen(false);
      }, 1800);
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
    }
  }

  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 90 }}>
      {open && (
        <div
          className="card"
          style={{
            width: 300,
            marginBottom: 12,
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div className="row" style={{ marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Suggest something</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ width: "auto", marginBottom: 0, background: "transparent", color: "#9a9a9a", padding: "4px 8px" }}
            >
              ✕
            </button>
          </div>
          {sent ? (
            <p className="success" style={{ marginBottom: 0 }}>Thanks — sent!</p>
          ) : (
            <form onSubmit={submit}>
              <p className="subtitle" style={{ marginBottom: 8, fontSize: 13 }}>
                Got an idea for something to add or change about the app? Type it below.
              </p>
              {error && <p className="error">{error}</p>}
              <textarea
                rows={4}
                placeholder="What would help you get more done in NobleDesk?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
                required
              />
              <button type="submit" disabled={sending} style={{ width: "100%" }}>
                {sending ? "Sending..." : "Send Suggestion"}
              </button>
            </form>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          padding: 0,
          fontSize: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: "auto",
          boxShadow: "0 8px 24px rgba(201, 162, 39, 0.35)",
        }}
        title="Suggest something"
      >
        💡
      </button>
    </div>
  );
}
