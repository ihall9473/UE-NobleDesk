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
  if (pathname === "/login") return null;

  return (
    <nav className="nav">
      <span style={{ color: "#fff", fontWeight: 700, fontSize: 16, marginRight: 12, letterSpacing: 0.2 }}>
        UE NobleDesk
      </span>
      {LINKS.map((link) => (
        
          key={link.href}
          href={link.href}
          className={pathname.startsWith(link.href) ? "active" : ""}
        >
          {link.label}
        </a>
      ))}
      <LogoutButton />
    </nav>
  );
}
