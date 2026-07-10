"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNavigation } from "@/lib/navigation";

export function SidebarNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin Dashboard">
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
                {item.plannedSprint > 61 ? (
                  <small>Sprint {item.plannedSprint}</small>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}