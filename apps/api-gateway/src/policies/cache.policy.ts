import type { ResponseCacheStore } from "../cache/redis-response-cache-store.js";
import type { RouteCachePolicy } from "./route-policy.types.js";

export type ResolvedRouteCachePolicy = {
  enabled: boolean;
  ttlSeconds: number;
  store?: ResponseCacheStore;
};

export type ResolveRouteCachePolicyOptions = {
  policy: RouteCachePolicy;
  store?: ResponseCacheStore;
  ttlSecondsOverride?: number;
};

export function buildResponseCacheKey(method: string, routePath: string): string {
  return `${method.toUpperCase()}:${routePath}`;
}

export function resolveRouteCachePolicy(
  options: ResolveRouteCachePolicyOptions,
): ResolvedRouteCachePolicy {
  return {
    enabled: options.policy.enabled && options.store !== undefined,
    ttlSeconds: options.ttlSecondsOverride ?? options.policy.ttlSeconds,
    store: options.store,
  };
}