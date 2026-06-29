import { describe, expect, it } from "vitest";

import type { RateLimitStore } from "../middlewares/rate-limit.middleware.js";
import { resolveRouteRateLimitPolicy } from "./rate-limit.policy.js";

describe("resolveRouteRateLimitPolicy", () => {
  it("should resolve enabled route rate limit policy", () => {
    const store = {} as RateLimitStore;

    const resolvedPolicy = resolveRouteRateLimitPolicy({
      policy: {
        enabled: true,
        limit: 5,
        windowMs: 60000,
      },
      routePath: "/api/products",
      identityType: "api-key",
      store,
    });

    expect(resolvedPolicy).toEqual({
      enabled: true,
      limit: 5,
      windowMs: 60000,
      routePath: "/api/products",
      identityType: "api-key",
      store,
    });
  });

  it("should resolve disabled route rate limit policy", () => {
    const store = {} as RateLimitStore;

    const resolvedPolicy = resolveRouteRateLimitPolicy({
      policy: {
        enabled: false,
        limit: 5,
        windowMs: 60000,
      },
      routePath: "/api/products",
      identityType: "api-key",
      store,
    });

    expect(resolvedPolicy).toEqual({
      enabled: false,
      limit: 5,
      windowMs: 60000,
      routePath: "/api/products",
      identityType: "api-key",
      store,
    });
  });
});