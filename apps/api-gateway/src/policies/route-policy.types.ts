export type RouteAuthPolicy = {
  requireApiKey: boolean;
  requireJwt: boolean;
};

export type RouteTimeoutPolicy = {
  enabled: boolean;
  timeoutMs: number;
};

export type RouteCachePolicy = {
  enabled: boolean;
  ttlSeconds: number;
};

export type RouteRateLimitPolicy = {
  enabled: boolean;
  limit: number;
  windowMs: number;
};

export type RouteHeaderTransformPolicy = {
  enabled: boolean;
  addHeaders?: Record<string, string>;
  removeHeaders?: string[];
};

export type RouteRetryPolicy = {
  enabled: boolean;
  attempts: number;
  retryOnStatuses: number[];
};

export type RoutePolicies = {
  auth: RouteAuthPolicy;
  timeout: RouteTimeoutPolicy;
  cache: RouteCachePolicy;
  rateLimit: RouteRateLimitPolicy;
  requestTransform: RouteHeaderTransformPolicy;
  responseTransform: RouteHeaderTransformPolicy;
  retry: RouteRetryPolicy;
};