import { describe, expect, it, vi } from "vitest";

import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";
import {
  fetchAdminReadUrl,
} from "./admin-read-resource";

const config: DashboardAdminApiConfig = {
  gatewayBaseUrl: "http://127.0.0.1:3000",
  apiKeyHeader: "x-admin-api-key",
  readOnlyApiKey: "read-only-secret",
  requestTimeoutMs: 1_000,
  accessMode: "read-only",
};

function isMessage(
  value: unknown,
): value is { message: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  );
}

describe("fetchAdminReadUrl", () => {
  it("uses a same-origin fixed Admin URL with read-only access", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: {
          message: "ok",
        },
      }),
    );

    const url = new URL(
      "/internal/admin/usage/events?limit=20",
      config.gatewayBaseUrl,
    );

    const result = await fetchAdminReadUrl(
      config,
      url,
      isMessage,
      fetchMock,
    );

    expect(result).toEqual({
      ok: true,
      accessMode: "read-only",
      data: {
        message: "ok",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: {
          accept: "application/json",
          "x-admin-api-key": "read-only-secret",
        },
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("rejects a cross-origin URL before making a request", async () => {
    const fetchMock = vi.fn();

    const result = await fetchAdminReadUrl(
      config,
      new URL(
        "https://example.com/internal/admin/usage/events",
      ),
      isMessage,
      fetchMock,
    );

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
        status: null,
        requestId: null,
      },
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a same-origin path outside the Admin boundary", async () => {
    const fetchMock = vi.fn();

    const result = await fetchAdminReadUrl(
      config,
      new URL("/api/products", config.gatewayBaseUrl),
      isMessage,
      fetchMock,
    );

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
