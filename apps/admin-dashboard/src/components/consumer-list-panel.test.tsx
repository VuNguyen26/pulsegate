import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ConsumerListPanel,
  ConsumerRegistryContent,
} from "./consumer-list-panel";
import type {
  DashboardConsumer,
} from "../lib/consumers";

const consumers: DashboardConsumer[] = [
  {
    id: "consumer_mobile",
    name: "Mobile App",
    description: "Main mobile application",
    status: "ACTIVE",
    createdAt: "2026-07-03T00:00:00.000Z",
    updatedAt: "2026-07-03T01:00:00.000Z",
    createdBy: "admin",
    updatedBy: "admin",
  },
  {
    id: "consumer_partner",
    name: "Partner App",
    description: null,
    status: "DISABLED",
    createdAt: "2026-07-03T00:00:00.000Z",
    updatedAt: "2026-07-03T01:00:00.000Z",
    createdBy: null,
    updatedBy: null,
  },
];

describe("ConsumerRegistryContent", () => {
  it("renders real consumer metadata and summary counts", () => {
    const html = renderToStaticMarkup(
      <ConsumerRegistryContent
        consumers={consumers}
      />,
    );

    expect(html).toContain(
      "<caption>Configured API consumers</caption>",
    );
    expect(html).toContain("Mobile App");
    expect(html).toContain("consumer_mobile");
    expect(html).toContain("ACTIVE");
    expect(html).toContain("DISABLED");
    expect(html).toContain("Total consumers");
    expect(html).toContain("unknown actor");
    expect(html).not.toContain("rawKey");
    expect(html).not.toContain("keyHash");
    expect(html).not.toContain(">Create<");
    expect(html).not.toContain(">Edit<");
  });

  it("renders the explicit empty state", () => {
    const html = renderToStaticMarkup(
      <ConsumerRegistryContent consumers={[]} />,
    );

    expect(html).toContain(
      "No consumers configured",
    );
    expect(html).toContain(
      "PulseGate did not return any API consumers.",
    );
  });

  it("server-renders a safe loading state initially", () => {
    const html = renderToStaticMarkup(
      <ConsumerListPanel />,
    );

    expect(html).toContain("Consumer registry");
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain(
      "x-admin-api-key",
    );
  });
});
