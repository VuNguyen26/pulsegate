"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNavigation } from "@/lib/navigation";

export function SidebarNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="sidebar-navigation"
      aria-label="Admin Dashboard"
    >
      <p className="navigation-label">Explore</p>

      <ul className="navigation-list">
        {dashboardNavigation.map((item) => {
          const active = pathname === item.href;

          return (
            <li key={item.href}>
              <Link
                className="navigation-link"
                data-active={active}
                href={item.href}
                aria-current={active ? "page" : undefined}
              >
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="navigation-note">
        Read-only public demo. Privileged credentials remain server-side.
      </p>
    </nav>
  );
}