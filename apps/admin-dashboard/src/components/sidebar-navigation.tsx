"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  dashboardNavigation,
  type DashboardNavigationItem,
} from "@/lib/navigation";

type NavigationGroup = {
  label: string;
  items: readonly DashboardNavigationItem[];
};

const navigationGroups: readonly NavigationGroup[] = [
  {
    label: "Control plane",
    items: dashboardNavigation.filter((item) =>
      ["/", "/routes"].includes(item.href),
    ),
  },
  {
    label: "Identity and plans",
    items: dashboardNavigation.filter((item) =>
      ["/consumers", "/api-keys", "/usage-plans"].includes(item.href),
    ),
  },
  {
    label: "Traffic intelligence",
    items: dashboardNavigation.filter((item) =>
      ["/usage-analytics", "/rejected-events"].includes(item.href),
    ),
  },
  {
    label: "Data operations",
    items: dashboardNavigation.filter((item) =>
      ["/rollups", "/scheduler", "/retention"].includes(item.href),
    ),
  },
];

export function SidebarNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="sidebar-navigation"
      aria-label="Admin Dashboard"
    >
      <div className="sidebar-intro">
        <p className="navigation-label">Workspace</p>
        <strong>Gateway operations</strong>
        <span>Live, bounded and safe to inspect.</span>
      </div>

      <div className="navigation-groups">
        {navigationGroups.map((group) => (
          <section className="navigation-group" key={group.label}>
            <p className="navigation-group-label">{group.label}</p>

            <ul className="navigation-list">
              {group.items.map((item) => {
                const active = pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      className="navigation-link"
                      data-active={active}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                    >
                      <NavigationIcon href={item.href} />
                      <span className="navigation-link-copy">
                        <strong>{item.label}</strong>
                        <small>{navigationHint(item.href)}</small>
                      </span>
                      <span
                        className="navigation-chevron"
                        aria-hidden="true"
                      >
                        ›
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <aside className="navigation-note">
        <span className="navigation-note-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img">
            <path d="M12 3 5.5 5.8v5.7c0 4.2 2.7 7.9 6.5 9.5 3.8-1.6 6.5-5.3 6.5-9.5V5.8z" />
            <path d="m9.2 12 1.8 1.8 3.8-4" />
          </svg>
        </span>
        <span>
          <strong>Protected public boundary</strong>
          Privileged credentials remain server-side.
        </span>
      </aside>
    </nav>
  );
}

function navigationHint(href: string): string {
  switch (href) {
    case "/":
      return "System posture";
    case "/routes":
      return "Runtime registry";
    case "/consumers":
      return "Client identities";
    case "/api-keys":
      return "Credential inventory";
    case "/usage-plans":
      return "Quota policies";
    case "/usage-analytics":
      return "Successful traffic";
    case "/rejected-events":
      return "Rejected traffic";
    case "/rollups":
      return "Aggregated data";
    case "/scheduler":
      return "Execution preview";
    case "/retention":
      return "Deletion preview";
    default:
      return "Read-only view";
  }
}

function NavigationIcon({ href }: { href: string }) {
  const path = iconPath(href);

  return (
    <span className="navigation-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" role="img">
        <path d={path} />
      </svg>
    </span>
  );
}

function iconPath(href: string): string {
  switch (href) {
    case "/":
      return "M4 13h6V4H4zm10 7h6v-9h-6zM4 20h6v-3H4zm10-13h6V4h-6z";
    case "/routes":
      return "M5 6h9a4 4 0 0 1 4 4v1m0 0-3-3m3 3 3-3M19 18h-9a4 4 0 0 1-4-4v-1m0 0 3 3m-3-3-3 3";
    case "/consumers":
      return "M16 18v-1.5a4.5 4.5 0 0 0-9 0V18m4.5-8A3.5 3.5 0 1 0 11.5 3a3.5 3.5 0 0 0 0 7m5.5 1a3 3 0 0 1 3 3v1.5M17 8a2.5 2.5 0 1 0 0-5";
    case "/api-keys":
      return "M14.5 9.5a4.5 4.5 0 1 0-3.2 4.3L14 16.5h2V19h2v2h3v-3.2l-6.3-6.3a4.5 4.5 0 0 0-.2-2z";
    case "/usage-plans":
      return "M6 4h12v16H6zM9 8h6m-6 4h6m-6 4h4";
    case "/usage-analytics":
      return "M4 19V9m5 10V5m5 14v-7m5 7V3";
    case "/rejected-events":
      return "M12 3 4.5 6v5.5c0 4.5 3 8.3 7.5 9.5 4.5-1.2 7.5-5 7.5-9.5V6zm-3 6 6 6m0-6-6 6";
    case "/rollups":
      return "M5 6h14M5 12h14M5 18h14M8 4v4m4 2v4m4 2v4";
    case "/scheduler":
      return "M6 4v3m12-3v3M4 9h16v11H4zM8 13h3m2 0h3m-8 4h3";
    case "/retention":
      return "M5 7h14m-9-3h4m-7 3 1 14h8l1-14M10 11v6m4-6v6";
    default:
      return "M5 5h14v14H5z";
  }
}
