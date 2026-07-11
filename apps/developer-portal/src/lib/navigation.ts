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
    description: "Verified public API documentation foundation.",
    status: "available",
  },
  {
    href: "/api-keys",
    label: "API keys",
    description: "Non-operational API-key self-service foundation.",
    status: "available",
  },
];

export function findPortalNavigationItem(
  pathname: string,
): PortalNavigationItem | undefined {
  return portalNavigation.find((item) => item.href === pathname);
}
