"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";
import Crest from "./Crest";
import { TEXTING_ENABLED, APP_NAME } from "@/lib/features";

// Quoter and Client Sheet stay flat top-level links; everything else with
// more than one destination is grouped into a dropdown.
const NAV_ITEMS_BEFORE_GROUPS = [
  { href: "/quoter", label: "Quoter" },
  { href: "/clients/sheet", label: "Client Sheet" },
];

const CLIENTS_GROUP = {
  label: "Clients",
  children: [
    { href: "/clients", label: "Book of Business" },
    { href: "/alerts", label: "Alerts" },
  ],
};

const LEADS_GROUP = {
  label: "Leads",
  children: [
    { href: "/leads", label: "Leads" },
    { href: "/pipeline", label: "Pipeline" },
    { href: "/tasks", label: "Tasks" },
  ],
};

const MESSAGING_GROUP = {
  label: "Messaging",
  children: [
    { href: "/compose", label: "Send a Text" },
    { href: "/conversations", label: "Conversations" },
    { href: "/occasions", label: "Occasions" },
  ],
};

const LICENSING_GROUP = {
  label: "Licensing",
  children: [
    { href: "/carriers", label: "Carriers" },
    { href: "/licensing", label: "States" },
  ],
};

// Texting-only groups are dropped entirely on the App Store build (see
// lib/features.js), not just hidden.
const NAV_GROUPS = [CLIENTS_GROUP, LEADS_GROUP, ...(TEXTING_ENABLED ? [MESSAGING_GROUP] : []), LICENSING_GROUP];

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
  const [collapsed, setCollapsed] = useState(false);
  const navRef = useRef(null);

  // Remembered per-browser, not shared/critical - fine to skip silently if
  // storage is unavailable (private browsing, etc.).
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("navCollapsed") === "true");
    } catch {}
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("navCollapsed", String(next));
      } catch {}
      return next;
    });
  }

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

  // Close any open dropdown on route change or an outside click. On a
  // narrow screen the drawer is a full overlay, so also close it - on
  // desktop the sidebar stays put, since it isn't covering anything.
  useEffect(() => {
    setOpenGroup(null);
    try {
      if (window.matchMedia("(max-width: 880px)").matches) {
        setCollapsed(true);
        localStorage.setItem("navCollapsed", "true");
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <>
      {/* Only visible on narrow screens, and only while the drawer is
          closed - the in-drawer toggle above goes off-screen with it, so
          this is the one thing that has to live outside <nav>. */}
      {collapsed && (
        <button
          type="button"
          className="nav-mobile-toggle"
          onClick={toggleCollapsed}
          aria-label="Show navigation"
          title="Show navigation"
        >
          ☰
        </button>
      )}

      {/* Tapping outside the open drawer closes it, same as an outside
          click already does for a dropdown - mobile only (CSS-gated). */}
      {!collapsed && <div className="nav-backdrop" onClick={toggleCollapsed} />}

      <nav className={`nav${!collapsed ? " nav-open" : ""}`} ref={navRef}>
      <div className="nav-header">
        <a href="/" className="nav-brand">
          <Crest size={26} className="nav-crest" />
          <span className="nav-wordmark">{APP_NAME}</span>
        </a>

        <button
          type="button"
          className="nav-toggle"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Show navigation" : "Hide navigation"}
          title={collapsed ? "Show navigation" : "Hide navigation"}
        >
          {collapsed ? "☰" : "✕"}
        </button>
      </div>

      {!collapsed && (
        <>
          {NAV_ITEMS_BEFORE_GROUPS.map((item) => (
            <a key={item.href} href={item.href} className={isLinkActive(item.href, pathname) ? "active" : ""}>
              {item.label}
            </a>
          ))}

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
        </>
      )}

      <div className="nav-footer">
        <LogoutButton />
      </div>
      </nav>
    </>
  );
}
