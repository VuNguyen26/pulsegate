import type { Metadata } from "next";

import {
  UsagePlanListPanel,
} from "@/components/usage-plan-list-panel";

export const metadata: Metadata = {
  title: "Usage Plans",
};

export default function UsagePlansPage() {
  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">
          Public Demo - Read-only configuration
        </p>
        <h1>Usage plans</h1>
        <p>
          Review persisted quota limits, quota windows,
          enabled state, and audit metadata. This view does
          not change quota enforcement or plan configuration.
        </p>
      </header>

      <UsagePlanListPanel />
    </section>
  );
}
