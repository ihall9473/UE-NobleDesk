"use client";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";
import Crest from "./Crest";

const LINKS = [
  { href: "/leads", label: "Leads" },
  { href: "/clients/sheet", label: "Client Sheet" },
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
    pathname.startsWith("/terms") ||
    pathname.startsWith("/request-info")
  ) {
    return null;
  }

  return (
    <nav className="nav">
      <a href="/" className="nav-brand">
        <Crest size={26} className="nav-crest" />
        <span className="nav-wordmark">UE NobleDesk</span>
      </a>
      {LINKS.map((link) => {
        const isActive =
          link.href === "/clients"
            ? pathname === "/clients" || (pathname.startsWith("/clients/") && !pathname.startsWith("/clients/sheet"))
            : pathname.startsWith(link.href);
        return (
          <a key={link.href} href={link.href} className={isActive ? "active" : ""}>{link.label}</a>
        );
      })}
      <LogoutButton />
    </nav>
  );
}
