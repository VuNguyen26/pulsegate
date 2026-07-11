import { describe, expect, it } from "vitest";

import {
  buildRouteRowKey,
  formatRouteRequestHost,
  isOptionalRouteRequestHost,
  isRouteRequestHost,
} from "./route-host";

describe("route host presentation", () => {
  it("accepts persisted host and path-only values", () => {
    expect(isRouteRequestHost("api.example.com"))
      .toBe(true);
    expect(isRouteRequestHost(null)).toBe(true);
    expect(isOptionalRouteRequestHost(undefined))
      .toBe(true);
  });

  it("rejects invalid host presentation values", () => {
    expect(isRouteRequestHost("")).toBe(false);
    expect(isRouteRequestHost(123)).toBe(false);
  });

  it("formats path-only and host-specific routes", () => {
    expect(formatRouteRequestHost(null))
      .toBe("Path-only");
    expect(formatRouteRequestHost(undefined))
      .toBe("Path-only");
    expect(
      formatRouteRequestHost("api.example.com"),
    ).toBe("api.example.com");
  });

  it("includes host identity in row keys", () => {
    expect(
      buildRouteRowKey({
        requestHost: "api.example.com",
        method: "GET",
        gatewayPath: "/api/products",
      }),
    ).toBe(
      "api.example.com:GET:/api/products",
    );

    expect(
      buildRouteRowKey({
        requestHost: null,
        method: "GET",
        gatewayPath: "/api/products",
      }),
    ).toBe("*:GET:/api/products");
  });
});
