import type { Metadata } from "next";

import {
  RegistryWorkspace,
  type RegistryWorkspaceCapability,
  type RegistryWorkspaceStep,
} from "../../components/registry-workspace";
import {
  RouteRegistryPanel,
} from "../../components/route-registry-panel";

export const metadata: Metadata = {
  title: "Routes",
};

const steps: readonly RegistryWorkspaceStep[] = [
  {
    label: "Match",
    title: "Host, method, and path",
    detail: "Resolve the persisted route identity before policy execution.",
  },
  {
    label: "Protect",
    title: "Authentication and traffic policy",
    detail: "Inspect enabled auth, rate, cache, timeout, retry, and transform groups.",
  },
  {
    label: "Resolve",
    title: "Healthy downstream target",
    detail: "Compare static, discovered, and weighted upstream configuration.",
  },
];

const capabilities: readonly RegistryWorkspaceCapability[] = [
  {
    icon: "route",
    eyebrow: "Route identity",
    title: "Host-aware matching",
    description:
      "Method, gateway path, request host, priority, and service identity stay visible in one route record.",
  },
  {
    icon: "target",
    eyebrow: "Traffic distribution",
    title: "Weighted upstreams",
    description:
      "Inspect each configured target and weight without exposing a control that can redirect live traffic.",
  },
  {
    icon: "health",
    eyebrow: "Runtime resolution",
    title: "Service discovery",
    description:
      "Compare persisted service instances with the separate route snapshot currently loaded by the Gateway.",
  },
  {
    icon: "policy",
    eyebrow: "Request policy",
    title: "Policy chain",
    description:
      "Authentication, limits, cache, resilience, and transforms are summarized as one bounded execution model.",
  },
];

export default function RoutesPage() {
  return (
    <RegistryWorkspace
      tone="routes"
      eyebrow="Traffic control plane"
      title="Inspect how every route moves traffic."
      description="Trace persisted route intent from request matching through policy enforcement to downstream resolution, then compare it with the Gateway runtime snapshot."
      badges={[
        "Persisted registry",
        "Runtime snapshot",
        "No mutations",
      ]}
      previewLabel="Route decision"
      previewTitle="GET /api/products"
      steps={steps}
      capabilities={capabilities}
      boundaryTitle="Observation without traffic mutation"
      boundaryItems={[
        "No route creation, edit, or deletion",
        "No runtime reload or configuration apply",
        "No secret-bearing upstream controls",
      ]}
    >
      <RouteRegistryPanel />
    </RegistryWorkspace>
  );
}
