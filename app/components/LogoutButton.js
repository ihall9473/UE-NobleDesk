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
        color: "#9a9a9a",
        border: "1px solid rgba(255,255,255,0.14)",
        padding: "6px 14px",
        fontSize: 13,
        marginLeft: "auto",
      }}
    >
      Log Out
    </button>
  );
}
