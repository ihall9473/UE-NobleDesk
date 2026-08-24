"use client";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LogoutButton() {
  async function handleLogout() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        background: "transparent",
        color: "var(--text-muted)",
        border: "1px solid rgba(201, 162, 39, 0.3)",
        borderRadius: 999,
        padding: "9px 18px",
        fontSize: 12.5,
        fontWeight: 600,
        letterSpacing: "1.1px",
        textTransform: "uppercase",
        marginLeft: "auto",
        transition: "color 0.15s ease, border-color 0.15s ease, background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "#c9a227";
        e.currentTarget.style.borderColor = "rgba(201, 162, 39, 0.6)";
        e.currentTarget.style.background = "rgba(201, 162, 39, 0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--text-muted)";
        e.currentTarget.style.borderColor = "rgba(201, 162, 39, 0.3)";
        e.currentTarget.style.background = "transparent";
      }}
    >
      Log Out
    </button>
  );
}
