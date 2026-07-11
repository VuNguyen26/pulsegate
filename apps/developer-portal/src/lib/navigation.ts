export type PortalNavigationItem = {
  href: string;
  label: string;
  description: string;
  status: "available" | "planned";
};

export const portalNavigation: readonly PortalNavigationItem[] = [
  {
    href: "/",
    label: "Overview",
    description: "PulseGate platform and Developer Portal foundation.",
    status: "available",
  },
  {
    href: "/getting-started",
    label: "Getting started",
    description: "Understand the current public integration path.",
    status: "available",
  },
  {
    href: "/api-docs",
    label: "API docs",
    description: "API documentation planned for Sprint 66.",
    status: "planned",
  },
  {
    href: "/api-keys",
    label: "API keys",
    description: "Self-service foundation planned for Sprint 66.",
    status: "planned",
  },
];

export function findPortalNavigationItem(
  pathname: string,
): PortalNavigationItem | undefined {
  return portalNavigation.find((item) => item.href === pathname);
}
