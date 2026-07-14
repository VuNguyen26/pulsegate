"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { portalNavigation } from "@/lib/navigation";

export function PortalNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="portal-navigation"
      aria-label="Developer Portal navigation"
      data-open={open}
      data-visual-system="p7-mobile-navigation"
    >
      <button
        className="portal-navigation-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="portal-navigation-links"
        aria-label={
          open
            ? "Close Developer Portal navigation"
            : "Open Developer Portal navigation"
        }
        onClick={() => setOpen((current) => !current)}
      >
        <span>{open ? "Close" : "Menu"}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          {open ? (
            <path d="m6 6 8 8m0-8-8 8" />
          ) : (
            <path d="M4 6h12M4 10h12M4 14h12" />
          )}
        </svg>
      </button>

      <ul className="navigation-list" id="portal-navigation-links">
        {portalNavigation.map((item) => {
          const active = pathname === item.href;

          return (
            <li key={item.href}>
              <Link
                data-active={active}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
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
