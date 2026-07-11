import Link from "next/link";

import { portalNavigation } from "@/lib/navigation";

export function PortalNavigation() {
  return (
    <nav aria-label="Developer Portal navigation">
      <ul className="navigation-list">
        {portalNavigation.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>
              <span>{item.label}</span>
              {item.status === "planned" ? (
                <small>Planned</small>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
