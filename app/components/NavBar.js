"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";
import Crest from "./Crest";
import { TEXTING_ENABLED, APP_NAME } from "@/lib/features";

// Grouped under a dropdown so the top bar doesn't turn into a wall of
// links as more pages get added. Each group's own heading highlights when
// any of its children is the active page.
const NAV_GROUPS = [
  {
    label: "Leads",
    children: [
      { href: "/leads", label: "Leads" },
      { href: "/pipeline", label: "Pipeline" },
    ],
  },
  {
    label: "Clients",
    children: [
      { href: "/clients", label: "Clients" },
      { href: "/clients/sheet", label: "Client Sheet" },
    ],
  },
  {
    label: "Follow-Up",
    children: [
      { href: "/tasks", label: "Tasks" },
      { href: "/alerts", label: "Alerts" },
      ...(TEXTING_ENABLED ? [{ href: "/drip-campaigns", label: "Drip Campaigns" }] : []),
    ],
  },
  ...(TEXTING_ENABLED
    ? [
        {
          label: "Messaging",
          children: [
            { href: "/compose", label: "Send a Text" },
            { href: "/conversations", label: "Conversations" },
            { href: "/occasions", label: "Occasions" },
          ],
        },
      ]
    : []),
  {
    label: "Business",
    children: [
      { href: "/dashboard", label: "Book of Business" },
      { href: "/carriers", label: "Carriers" },
      { href: "/licensing", label: "Licensing" },
    ],
  },
];

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

  // Close whichever dropdown is open on route change or an outside click.
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

      {NAV_GROUPS.map((group) => (
        <NavGroup
          key={group.label}
          group={group}
          pathname={pathname}
          isOpen={openGroup === group.label}
          onToggle={() => setOpenGroup((g) => (g === group.label ? null : group.label))}
        />
      ))}

      {/* My Team stays out of the way for agents until they've actually
          sent an invite - admins/managers always see it since building
          the org is core to their role. */}
      {showTeamTab && (
        <a href="/team" className={isLinkActive("/team", pathname) ? "active" : ""}>My Team</a>
      )}
      <a href="/settings" className={isLinkActive("/settings", pathname) ? "active" : ""}>Settings</a>
      <a href="/admin" className={isLinkActive("/admin", pathname) ? "active" : ""}>Admin</a>

      <LogoutButton />
    </nav>
  );
}
