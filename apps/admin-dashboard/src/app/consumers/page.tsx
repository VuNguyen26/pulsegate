import type { Metadata } from "next";

import {
  ConsumerListPanel,
} from "@/components/consumer-list-panel";

export const metadata: Metadata = {
  title: "Consumers",
};

export default function ConsumersPage() {
  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">
          Public Demo - Read-only registry
        </p>
        <h1>API consumers</h1>
        <p>
          Review the bounded consumer registry through a
          fixed server-only Admin API boundary. No consumer
          mutation is available in this checkpoint.
        </p>
      </header>

      <ConsumerListPanel />
    </section>
  );
}
