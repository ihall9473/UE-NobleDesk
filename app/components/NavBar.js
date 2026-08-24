"use client";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

const LINKS = [
  { href: "/leads", label: "Leads" },
  { href: "/clients", label: "Clients" },
  { href: "/compose", label: "Send a Text" },
  { href: "/conversations", label: "Conversations" },
  { href: "/occasions", label: "Occasions" },
  { href: "/settings", label: "Settings" },
  { href: "/admin", label: "Admin" },
];

export default function NavBar() {
  const pathname = usePathname();
  if (
    pathname === "/login" ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms")
  ) {
    return null;
  }

  return (
    <nav className="nav">
      <span style={{ color: "#fff", fontWeight: 700, fontSize: 24, marginRight: 20, letterSpacing: 0.2, fontFamily: "'Playfair Display', serif" }}>UE NobleDesk</span>
      {LINKS.map((link) => {
        const isActive = pathname.startsWith(link.href);
        return (
          <a key={link.href} href={link.href} className={isActive ? "active" : ""}>{link.label}</a>
        );
      })}
      <LogoutButton />
    </nav>
  );
}
