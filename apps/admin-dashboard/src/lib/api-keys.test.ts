import { describe, expect, it, vi } from "vitest";

import {
  MAX_DASHBOARD_API_KEYS,
  getDashboardConsumerApiKeysPath,
  isDashboardApiKeyList,
  isDashboardConsumerId,
  loadDashboardConsumerApiKeys,
  summarizeDashboardApiKeys,
  type DashboardApiKey,
} from "./api-keys";

const activeApiKey: DashboardApiKey = {
  id: "key_mobile_prod",
  consumerId: "consumer_mobile",
  usagePlanId: "plan_starter",
  name: "Mobile Production Key",
  keyPrefix: "pgk_live_existing",
  status: "ACTIVE",
  expiresAt: null,
  lastUsedAt: "2026-07-03T02:00:00.000Z",
  createdAt: "2026-07-03T00:00:00.000Z",
  updatedAt: "2026-07-03T01:00:00.000Z",
  createdBy: "admin",
  revokedAt: null,
  revokedBy: null,
};

const revokedApiKey: DashboardApiKey = {
  ...activeApiKey,
  id: "key_mobile_old",
  usagePlanId: null,
  status: "REVOKED",
  revokedAt: "2026-07-03T03:00:00.000Z",
  revokedBy: "admin",
};

describe("Dashboard consumer API key contract", () => {
  it("accepts safe consumer ids and builds only the fixed BFF path", () => {
    expect(isDashboardConsumerId("runtime_consumer_52_5")).toBe(true);
    expect(isDashboardConsumerId("consumer-mobile")).toBe(true);
    expect(isDashboardConsumerId("../api-keys")).toBe(false);
    expect(isDashboardConsumerId("consumer/mobile")).toBe(false);
    expect(isDashboardConsumerId(" consumer_mobile")).toBe(false);

    expect(
      getDashboardConsumerApiKeysPath("consumer_mobile"),
    ).toBe(
      "/api/admin/consumers/consumer_mobile/api-keys",
    );
  });

  it("loads API keys through GET and no-store without a browser credential", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: [activeApiKey],
      }),
    );

    const result =
      await loadDashboardConsumerApiKeys(
        "consumer_mobile",
        fetchMock,
      );

    expect(result).toEqual({
      status: "success",
      data: [activeApiKey],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/consumers/consumer_mobile/api-keys",
      {
        method: "GET",
        headers: {
          accept: "application/json",
        },
        cache: "no-store",
      },
    );
    expect(
      JSON.stringify(fetchMock.mock.calls),
    ).not.toContain("x-admin-api-key");
  });

  it("rejects invalid ids before invoking fetch", async () => {
    const fetchMock = vi.fn();

    const result =
      await loadDashboardConsumerApiKeys(
        "../all-api-keys",
        fetchMock,
      );

    expect(result).toMatchObject({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed on cross-consumer data", async () => {
    const result =
      await loadDashboardConsumerApiKeys(
        "consumer_mobile",
        async () =>
          Response.json({
            data: [
              {
                ...activeApiKey,
                consumerId: "consumer_partner",
              },
            ],
          }),
      );

    expect(result).toMatchObject({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
  });

  it("rejects raw keys and hashes at any response depth", async () => {
    for (const sensitiveField of [
      "rawKey",
      "keyHash",
    ] as const) {
      const result =
        await loadDashboardConsumerApiKeys(
          "consumer_mobile",
          async () =>
            Response.json({
              data: [
                {
                  ...activeApiKey,
                  [sensitiveField]:
                    "must-not-reach-browser",
                },
              ],
            }),
        );

      expect(result).toMatchObject({
        status: "error",
        error: {
          code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
        },
      });
      expect(JSON.stringify(result)).not.toContain(
        "must-not-reach-browser",
      );
    }
  });

  it("keeps the API key list bounded", () => {
    expect(
      isDashboardApiKeyList(
        Array.from(
          {
            length: MAX_DASHBOARD_API_KEYS + 1,
          },
          (_, index) => ({
            ...activeApiKey,
            id: `key_${index}`,
          }),
        ),
      ),
    ).toBe(false);
  });

  it("summarizes active, revoked, and assigned metadata", () => {
    expect(
      summarizeDashboardApiKeys([
        activeApiKey,
        revokedApiKey,
      ]),
    ).toEqual({
      total: 2,
      active: 1,
      revoked: 1,
      assigned: 1,
    });
  });
});
