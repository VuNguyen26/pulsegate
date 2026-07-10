import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ApiKeyListPanel,
  ApiKeyRegistryContent,
} from "./api-key-list-panel";
import type {
  DashboardApiKey,
} from "../lib/api-keys";
import type {
  DashboardConsumer,
} from "../lib/consumers";

const consumer: DashboardConsumer = {
  id: "consumer_mobile",
  name: "Mobile App",
  description: "Main mobile application",
  status: "ACTIVE",
  createdAt: "2026-07-03T00:00:00.000Z",
  updatedAt: "2026-07-03T01:00:00.000Z",
  createdBy: "admin",
  updatedBy: "admin",
};

const apiKeys: DashboardApiKey[] = [
  {
    id: "key_mobile_prod",
    consumerId: "consumer_mobile",
    usagePlanId: "plan_starter",
    name: "Mobile Production Key",
    keyPrefix: "pgk_live_existing",
    status: "ACTIVE",
    expiresAt: null,
    lastUsedAt: null,
    createdAt: "2026-07-03T00:00:00.000Z",
    updatedAt: "2026-07-03T01:00:00.000Z",
    createdBy: "admin",
    revokedAt: null,
    revokedBy: null,
  },
  {
    id: "key_mobile_old",
    consumerId: "consumer_mobile",
    usagePlanId: null,
    name: "Mobile Old Key",
    keyPrefix: "pgk_live_old",
    status: "REVOKED",
    expiresAt: null,
    lastUsedAt: "2026-07-03T02:00:00.000Z",
    createdAt: "2026-07-02T00:00:00.000Z",
    updatedAt: "2026-07-03T03:00:00.000Z",
    createdBy: null,
    revokedAt: "2026-07-03T03:00:00.000Z",
    revokedBy: "admin",
  },
];

describe("ApiKeyRegistryContent", () => {
  it("renders safe API key metadata and summary counts", () => {
    const html = renderToStaticMarkup(
      <ApiKeyRegistryContent
        consumer={consumer}
        apiKeys={apiKeys}
      />,
    );

    expect(html).toContain(
      "API key metadata for Mobile App",
    );
    expect(html).toContain(
      "Mobile Production Key",
    );
    expect(html).toContain(
      "pgk_live_existing",
    );
    expect(html).toContain("ACTIVE");
    expect(html).toContain("REVOKED");
    expect(html).toContain("Usage plan assigned");
    expect(html).not.toContain("rawKey");
    expect(html).not.toContain("keyHash");
    expect(html).not.toContain(">Issue<");
    expect(html).not.toContain(">Revoke<");
  });

  it("renders the consumer-scoped empty state", () => {
    const html = renderToStaticMarkup(
      <ApiKeyRegistryContent
        consumer={consumer}
        apiKeys={[]}
      />,
    );

    expect(html).toContain(
      "No API keys configured",
    );
    expect(html).toContain("Mobile App");
  });

  it("server-renders a safe initial loading state", () => {
    const html = renderToStaticMarkup(
      <ApiKeyListPanel />,
    );

    expect(html).toContain("API key registry");
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("x-admin-api-key");
    expect(html).not.toContain("ADMIN_READ_ONLY_API_KEY");
  });
});
