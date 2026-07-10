import { describe, expect, it } from "vitest";

import {
  mapRuntimeStatusResponse,
  type DashboardRuntimeStatusResult,
} from "./admin-runtime-status-response";

describe("mapRuntimeStatusResponse", () => {
  it("returns only safe runtime metadata", () => {
    const result = {
      ok: true,
      accessMode: "read-only",
      readOnlyApiKey: "must-not-leak",
      data: {
        mode: "runtime-registry",
        available: true,
        version: 2,
        loadedAt: "2026-07-10T00:00:00.000Z",
        routeCount: 1,
        routes: [
          {
            method: "GET",
            gatewayPath: "/api/products",
            serviceName: "product-service",
          },
        ],
      },
    } as DashboardRuntimeStatusResult;

    const response = mapRuntimeStatusResponse(result);

    expect(response.status).toBe(200);
    expect(JSON.stringify(response)).not.toContain(
      "must-not-leak",
    );
    expect(response.body).toMatchObject({
      data: {
        accessMode: "read-only",
        runtime: {
          routeCount: 1,
        },
      },
    });
  });

  it("maps missing configuration to service unavailable", () => {
    const response = mapRuntimeStatusResponse({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_CONFIG_MISSING",
        field: "ADMIN_READ_ONLY_API_KEY",
        message:
          "Read-only Admin API credential is required.",
      },
    });

    expect(response).toMatchObject({
      status: 503,
      body: {
        error: {
          code: "ADMIN_DASHBOARD_CONFIG_MISSING",
          requestId: null,
        },
      },
    });
  });

  it("preserves safe upstream request attribution", () => {
    const response = mapRuntimeStatusResponse({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_UNAUTHORIZED",
        message:
          "The Dashboard Admin API credential was not accepted.",
        status: 401,
        requestId: "request-401",
      },
    });

    expect(response).toMatchObject({
      status: 401,
      body: {
        error: {
          requestId: "request-401",
        },
      },
    });
  });

  it("maps an unavailable Gateway to service unavailable", () => {
    const response = mapRuntimeStatusResponse({
      ok: false,
      error: {
        code: "ADMIN_DASHBOARD_GATEWAY_UNAVAILABLE",
        message: "PulseGate Gateway is unavailable.",
        status: null,
        requestId: null,
      },
    });

    expect(response.status).toBe(503);
  });
});