"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";
import Crest from "./Crest";
import { TEXTING_ENABLED, APP_NAME } from "@/lib/features";

// Flat nav, in the exact order requested - only "Leads" stays a dropdown
// for now (Leads + Pipeline; Quoter got promoted to its own top-level link).
const NAV_ITEMS = [
  { href: "/quoter", label: "Quoter" },
  { href: "/clients/sheet", label: "Client Sheet" },
  { href: "/clients", label: "Clients" },
  { href: "/tasks", label: "Tasks" },
  { href: "/alerts", label: "Alerts" },
  ...(TEXTING_ENABLED
    ? [
        { href: "/drip-campaigns", label: "Drip Campaigns" },
        { href: "/compose", label: "Send a Text" },
        { href: "/conversations", label: "Conversations" },
        { href: "/occasions", label: "Occasions" },
      ]
    : []),
  { href: "/carriers", label: "Carriers" },
  { href: "/licensing", label: "Licensing" },
];

const LEADS_GROUP = {
  label: "Leads",
  children: [
    { href: "/leads", label: "Leads" },
    { href: "/pipeline", label: "Pipeline" },
  ],
};

function isLinkActive(href, pathname) {
  if (href === "/clients") {
    return pathname === "/clients" || (pathname.startsWith("/clients/") && !pathname.startsWith("/clients/sheet"));
  }
  return pathname.startsWith(href);
}

function NavGroup({ group, pathname, isOpen, onToggle }) {
  const active = group.children.some((c) => isLinkActive(c.href, pathname));
  return (
    <div className="nav-group">
      <button type="button" className={`nav-group-trigger${active ? " active" : ""}`} onClick={onToggle}>
        {group.label} <span className="nav-caret">{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && (
        <div className="nav-dropdown">
          {group.children.map((c) => (
            <a key={c.href} href={c.href} className={isLinkActive(c.href, pathname) ? "active" : ""}>
              {c.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const [showTeamTab, setShowTeamTab] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const navRef = useRef(null);

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

  // Close the Leads dropdown on route change or an outside click.
  useEffect(() => {
    setOpenGroup(null);
  }, [pathname]);

  useEffect(() => {
    function onClickOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenGroup(null);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (hidden) return null;

  return (
    <nav className="nav" ref={navRef}>
      <a href="/" className="nav-brand">
        <Crest size={26} className="nav-crest" />
        <span className="nav-wordmark">{APP_NAME}</span>
      </a>

      {NAV_ITEMS.map((item) => (
        <a key={item.href} href={item.href} className={isLinkActive(item.href, pathname) ? "active" : ""}>
          {item.label}
        </a>
      ))}

      {/* My Team stays out of the way for agents until they've actually
          sent an invite - admins/managers always see it since building
          the org is core to their role. */}
      {showTeamTab && (
        <a href="/team" className={isLinkActive("/team", pathname) ? "active" : ""}>My Team</a>
      )}

      <NavGroup
        group={LEADS_GROUP}
        pathname={pathname}
        isOpen={openGroup === LEADS_GROUP.label}
        onToggle={() => setOpenGroup((g) => (g === LEADS_GROUP.label ? null : LEADS_GROUP.label))}
      />

      <a href="/settings" className={isLinkActive("/settings", pathname) ? "active" : ""}>Settings</a>
      <a href="/admin" className={isLinkActive("/admin", pathname) ? "active" : ""}>Admin</a>

      <LogoutButton />
    </nav>
  );
}
