export type DashboardNavigationItem = {
  href: string;
  label: string;
  description: string;
  plannedSprint: 61 | 62 | 63 | 64;
};

export const dashboardNavigation: readonly DashboardNavigationItem[] = [
  {
    href: "/",
    label: "Overview",
    description: "Admin Dashboard foundation and connectivity status.",
    plannedSprint: 61,
  },
  {
    href: "/consumers",
    label: "Consumers",
    description: "API consumer management.",
    plannedSprint: 62,
  },
  {
    href: "/api-keys",
    label: "API Keys",
    description: "API key lifecycle and assignments.",
    plannedSprint: 62,
  },
  {
    href: "/usage-plans",
    label: "Usage Plans",
    description: "Usage-plan configuration.",
    plannedSprint: 62,
  },
  {
    href: "/routes",
    label: "Routes",
    description: "Gateway route configuration.",
    plannedSprint: 62,
  },
  {
    href: "/usage-analytics",
    label: "Usage Analytics",
    description: "Successful usage and quota analytics.",
    plannedSprint: 63,
  },
  {
    href: "/rejected-events",
    label: "Rejected Events",
    description: "Rejected and security traffic.",
    plannedSprint: 63,
  },
  {
    href: "/rollups",
    label: "Rollups",
    description: "Analytics rollup operator views.",
    plannedSprint: 64,
  },
  {
    href: "/scheduler",
    label: "Scheduler",
    description: "Scheduler operator views.",
    plannedSprint: 64,
  },
  {
    href: "/retention",
    label: "Retention",
    description: "Review-only retention operator views.",
    plannedSprint: 64,
  },
];

export function findNavigationItem(
  pathname: string,
): DashboardNavigationItem | undefined {
  return dashboardNavigation.find((item) => item.href === pathname);
}