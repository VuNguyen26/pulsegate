import type { Metadata } from "next";

import {
  RouteRegistryPanel,
} from "@/components/route-registry-panel";

export const metadata: Metadata = {
  title: "Routes",
};

export default function RoutesPage() {
  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">
          Public Demo - Read-only route registry
        </p>
        <h1>Gateway routes</h1>
        <p>
          Review persisted route configuration and the
          separate runtime registry snapshot. This view
          cannot mutate or reload Gateway routes.
        </p>
      </header>

      <RouteRegistryPanel />
    </section>
  );
}
