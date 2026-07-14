"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { portalNavigation } from "@/lib/navigation";

export function PortalNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="portal-navigation"
      aria-label="Developer Portal navigation"
    >
      <ul className="navigation-list">
        {portalNavigation.map((item) => {
          const active = pathname === item.href;

          return (
            <li key={item.href}>
              <Link
                data-active={active}
                href={item.href}
                aria-current={active ? "page" : undefined}
              >
                <span>{item.label}</span>
                {item.status === "planned" ? (
                  <small>Planned</small>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
