"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";
import Crest from "./Crest";
import { TEXTING_ENABLED, APP_NAME } from "@/lib/features";

const BASE_LINKS = [
  { href: "/leads", label: "Leads" },
  { href: "/clients/sheet", label: "Client Sheet" },
  { href: "/clients", label: "Clients" },
  ...(TEXTING_ENABLED
    ? [
        { href: "/compose", label: "Send a Text" },
        { href: "/conversations", label: "Conversations" },
        { href: "/occasions", label: "Occasions" },
      ]
    : []),
  { href: "/dashboard", label: "Book of Business" },
  { href: "/carriers", label: "Carriers" },
  { href: "/licensing", label: "Licensing" },
  { href: "/settings", label: "Settings" },
  { href: "/admin", label: "Admin" },
];

export default function NavBar() {
  const pathname = usePathname();
  const [showTeamTab, setShowTeamTab] = useState(false);

  const hidden =
    pathname === "/login" ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/set-password") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/request-info");

  useEffect(() => {
    if (hidden) return;
    fetch("/api/team/status")
      .then((r) => r.json())
      .then((d) => setShowTeamTab(d.hasInvited || d.role === "admin" || d.role === "manager"))
      .catch(() => {});
  }, [hidden]);

  if (hidden) return null;

  // My Team stays out of the way for agents until they've actually sent
  // an invite - admins/managers always see it since building the org is
  // core to their role.
  const carriersIndex = BASE_LINKS.findIndex((l) => l.href === "/carriers");
  const links = showTeamTab
    ? [
        ...BASE_LINKS.slice(0, carriersIndex + 1),
        { href: "/team", label: "My Team" },
        ...BASE_LINKS.slice(carriersIndex + 1),
      ]
    : BASE_LINKS;

  return (
    <nav className="nav">
      <a href="/" className="nav-brand">
        <Crest size={26} className="nav-crest" />
        <span className="nav-wordmark">{APP_NAME}</span>
      </a>
      {links.map((link) => {
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
