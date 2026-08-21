"use client";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

export default function NavBar() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <nav className="nav">
      <span style={{ color: "#fff", fontWeight: 700, marginRight: 8 }}>UE NobleDesk</span>
      <a href="/leads">Leads</a>
      <a href="/clients">Clients</a>
      <a href="/compose">Send a Text</a>
      <a href="/conversations">Conversations</a>
      <a href="/occasions">Occasions</a>
      <a href="/settings">Settings</a>
      <a href="/admin">Admin</a>
      <LogoutButton />
    </nav>
  );
}
