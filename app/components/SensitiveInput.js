"use client";
import { useState } from "react";

// A text field for sensitive numbers (routing/account) - shows the real
// value while you're actively typing, hides it as soon as you click away,
// and has an eye button to peek at it again afterward.
export default function SensitiveInput({ value, onChange, placeholder, autoComplete = "new-password" }) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const visible = focused || revealed;

  return (
    <div style={{ position: "relative" }}>
      <input
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ paddingRight: 40 }}
      />
      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        onMouseDown={(e) => e.preventDefault()}
        title={visible ? "Hide" : "Show"}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100%",
          width: 36,
          padding: 0,
          background: "transparent",
          boxShadow: "none",
          color: "#9a9a9a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
