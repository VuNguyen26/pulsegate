import type { RateLimitStore } from "../middlewares/rate-limit.middleware.js";
import type { RouteRateLimitPolicy } from "./route-policy.types.js";

export type RouteRateLimitIdentityType = "api-key";

export type ResolvedRouteRateLimitPolicy = {
  enabled: boolean;
  limit: number;
  windowMs: number;
  routePath: string;
  identityType: RouteRateLimitIdentityType;
  store: RateLimitStore;
};

export type ResolveRouteRateLimitPolicyOptions = {
  policy: RouteRateLimitPolicy;
  routePath: string;
  identityType: RouteRateLimitIdentityType;
  store: RateLimitStore;
};

export function resolveRouteRateLimitPolicy(
  options: ResolveRouteRateLimitPolicyOptions,
): ResolvedRouteRateLimitPolicy {
  return {
    enabled: options.policy.enabled,
    limit: options.policy.limit,
    windowMs: options.policy.windowMs,
    routePath: options.routePath,
    identityType: options.identityType,
    store: options.store,
  };
}