import { describe, expect, it, vi } from "vitest";

import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";
import {
  fetchAdminConsumerApiKeys,
} from "./admin-consumer-api-keys";

const config: DashboardAdminApiConfig = {
  gatewayBaseUrl: "http://127.0.0.1:3000",
  apiKeyHeader: "x-admin-api-key",
  readOnlyApiKey: "server-only-read-key",
  requestTimeoutMs: 100,
  accessMode: "read-only",
};

const validApiKey = {
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
};

describe("fetchAdminConsumerApiKeys", () => {
  it("uses the fixed consumer-scoped Gateway GET endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: [validApiKey],
      }),
    );

    const result =
      await fetchAdminConsumerApiKeys(
        config,
        "consumer_mobile",
        fetchMock,
      );

    expect(result).toEqual({
      ok: true,
      accessMode: "read-only",
      data: [validApiKey],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        "/internal/admin/consumers/consumer_mobile/api-keys",
        config.gatewayBaseUrl,
      ),
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: {
          accept: "application/json",
          "x-admin-api-key":
            "server-only-read-key",
        },
      }),
    );
  });

  it("rejects invalid ids before a Gateway request", async () => {
    const fetchMock = vi.fn();

    const result =
      await fetchAdminConsumerApiKeys(
        config,
        "../api-keys",
        fetchMock,
      );

    expect(result).toEqual({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_NOT_FOUND",
        message:
          "The selected API consumer was not found.",
        status: 404,
        requestId: null,
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when Gateway returns another consumer's key", async () => {
    const result =
      await fetchAdminConsumerApiKeys(
        config,
        "consumer_mobile",
        async () =>
          Response.json({
            data: [
              {
                ...validApiKey,
                consumerId: "consumer_partner",
              },
            ],
          }),
      );

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
  });

  it("rejects sensitive key material from Gateway", async () => {
    const result =
      await fetchAdminConsumerApiKeys(
        config,
        "consumer_mobile",
        async () =>
          Response.json({
            data: [
              {
                ...validApiKey,
                keyHash: "must-not-leave-gateway",
              },
            ],
          }),
      );

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
    expect(JSON.stringify(result)).not.toContain(
      "must-not-leave-gateway",
    );
  });

  it("normalizes a missing consumer response", async () => {
    const result =
      await fetchAdminConsumerApiKeys(
        config,
        "consumer_mobile",
        async () =>
          Response.json(
            {
              error: {
                code: "API_CONSUMER_NOT_FOUND",
                message: "raw Gateway detail",
                requestId: "request-404",
              },
            },
            {
              status: 404,
            },
          ),
      );

    expect(result).toEqual({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_NOT_FOUND",
        message:
          "The selected API consumer was not found.",
        status: 404,
        requestId: "request-404",
      },
    });
    expect(JSON.stringify(result)).not.toContain(
      "raw Gateway detail",
    );
  });
});
