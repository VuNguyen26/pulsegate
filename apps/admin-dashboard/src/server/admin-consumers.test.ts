import { describe, expect, it, vi } from "vitest";

import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";
import {
  ADMIN_GATEWAY_READ_RESOURCE_PATHS,
} from "./admin-read-resource";
import { fetchAdminConsumers } from "./admin-consumers";

const config: DashboardAdminApiConfig = {
  gatewayBaseUrl: "http://127.0.0.1:3000",
  apiKeyHeader: "x-admin-api-key",
  readOnlyApiKey: "server-only-read-key",
  requestTimeoutMs: 100,
  accessMode: "read-only",
};

const validConsumer = {
  id: "consumer_mobile",
  name: "Mobile App",
  description: "Main mobile application",
  status: "ACTIVE",
  createdAt: "2026-07-03T00:00:00.000Z",
  updatedAt: "2026-07-03T01:00:00.000Z",
  createdBy: "admin",
  updatedBy: "admin",
};

describe("fetchAdminConsumers", () => {
  it("uses the fixed Gateway consumer GET endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: [validConsumer],
      }),
    );

    const result = await fetchAdminConsumers(
      config,
      fetchMock,
    );

    expect(result).toEqual({
      ok: true,
      accessMode: "read-only",
      data: [validConsumer],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        ADMIN_GATEWAY_READ_RESOURCE_PATHS.consumers,
        config.gatewayBaseUrl,
      ),
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: {
          accept: "application/json",
          "x-admin-api-key": "server-only-read-key",
        },
      }),
    );
  });

  it("fails closed on an invalid Gateway payload", async () => {
    const result = await fetchAdminConsumers(
      config,
      async () =>
        Response.json({
          data: [
            {
              id: "consumer_mobile",
              name: "Mobile App",
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

  it("normalizes a read-only authorization failure", async () => {
    const result = await fetchAdminConsumers(
      config,
      async () =>
        Response.json(
          {
            error: {
              code: "ADMIN_API_KEY_INVALID",
              message: "raw Gateway detail",
              requestId: "request-403",
            },
          },
          {
            status: 403,
          },
        ),
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_FORBIDDEN",
        message:
          "The Dashboard is not permitted to read this resource.",
        status: 403,
        requestId: "request-403",
      },
    });
    expect(JSON.stringify(result)).not.toContain(
      "raw Gateway detail",
    );
  });
});
