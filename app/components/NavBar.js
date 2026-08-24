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
      <a href="/leads" className="nav-brand">
        <svg className="nav-crest" width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 1.5 21 5.5V11c0 6-4 9.5-9 11.5C7 20.5 3 17 3 11V5.5L12 1.5Z"
            stroke="#c9a227"
            strokeWidth="1.4"
          />
          <path d="M12 6 16 8v3.2c0 3-1.7 5-4 6.3-2.3-1.3-4-3.3-4-6.3V8L12 6Z" fill="#c9a227" fillOpacity="0.9" />
        </svg>
        <span className="nav-wordmark">UE NobleDesk</span>
      </a>
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
