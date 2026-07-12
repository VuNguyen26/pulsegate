import type { DownstreamRouteConfig, HttpMethod } from "./downstream-routes.js";
import { normalizeConfiguredRequestHost } from "./request-host.js";
import {
  buildRouteIdentityKey,
  formatRouteIdentityLabel,
} from "./route-identity.js";

const SUPPORTED_HTTP_METHODS = new Set<HttpMethod>([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

const HTTP_HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function isValidHttpHeaderName(headerName: string): boolean {
  return HTTP_HEADER_NAME_PATTERN.test(headerName);
}

const MIN_WEIGHTED_UPSTREAM_COUNT = 2;
const MAX_WEIGHTED_UPSTREAM_COUNT = 8;
const MAX_WEIGHTED_UPSTREAM_WEIGHT = 1000;

function validateWeightedUpstreams(
  routeLabel: string,
  route: DownstreamRouteConfig,
): string[] {
  const errors: string[] = [];
  const weightedUpstreams = route.weightedUpstreams;

  if (weightedUpstreams === undefined) {
    return errors;
  }

  if (!Array.isArray(weightedUpstreams)) {
    errors.push(`${routeLabel} weightedUpstreams must be an array`);
    return errors;
  }

  if (weightedUpstreams.length < MIN_WEIGHTED_UPSTREAM_COUNT) {
    errors.push(
      `${routeLabel} weightedUpstreams must contain at least ${MIN_WEIGHTED_UPSTREAM_COUNT} upstreams`,
    );
  }

  if (weightedUpstreams.length > MAX_WEIGHTED_UPSTREAM_COUNT) {
    errors.push(
      `${routeLabel} weightedUpstreams must contain at most ${MAX_WEIGHTED_UPSTREAM_COUNT} upstreams`,
    );
  }

  const downstreamUrls = new Set<string>();
  let primaryDownstreamUrlCount = 0;

  for (const [index, upstream] of weightedUpstreams.entries()) {
    const upstreamLabel = `${routeLabel} weightedUpstreams[${index}]`;

    if (
      typeof upstream !== "object" ||
      upstream === null ||
      Array.isArray(upstream)
    ) {
      errors.push(`${upstreamLabel} must be an object`);
      continue;
    }

    const downstreamUrl = (
      upstream as {
        downstreamUrl?: unknown;
      }
    ).downstreamUrl;

    const weight = (
      upstream as {
        weight?: unknown;
      }
    ).weight;

    if (typeof downstreamUrl !== "string") {
      errors.push(`${upstreamLabel} downstreamUrl must be a string`);
    } else {
      errors.push(
        ...validateDownstreamUrl(upstreamLabel, downstreamUrl),
      );

      if (downstreamUrls.has(downstreamUrl)) {
        errors.push(
          `${routeLabel} weightedUpstreams contains duplicate downstreamUrl: ${downstreamUrl}`,
        );
      }

      downstreamUrls.add(downstreamUrl);

      if (downstreamUrl === route.downstreamUrl) {
        primaryDownstreamUrlCount += 1;
      }
    }

    if (
      !Number.isInteger(weight) ||
      (weight as number) < 1 ||
      (weight as number) > MAX_WEIGHTED_UPSTREAM_WEIGHT
    ) {
      errors.push(
        `${upstreamLabel} weight must be an integer between 1 and ${MAX_WEIGHTED_UPSTREAM_WEIGHT}`,
      );
    }
  }

  if (primaryDownstreamUrlCount !== 1) {
    errors.push(
      `${routeLabel} downstreamUrl must appear exactly once in weightedUpstreams`,
    );
  }

  return errors;
}

function validateDownstreamUrl(routeLabel: string, downstreamUrl: string): string[] {
  const errors: string[] = [];

  try {
    const url = new URL(downstreamUrl);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      errors.push(`${routeLabel} downstreamUrl must use http or https`);
    }
  } catch {
    errors.push(`${routeLabel} downstreamUrl must be a valid URL`);
  }

  return errors;
}

function validateHeaderTransformPolicy(
  routeLabel: string,
  policyName: "requestTransform" | "responseTransform",
  policy: DownstreamRouteConfig["policies"]["requestTransform"],
): string[] {
  const errors: string[] = [];

  if (!policy.enabled) {
    return errors;
  }

  for (const headerName of Object.keys(policy.addHeaders ?? {})) {
    if (!isValidHttpHeaderName(headerName)) {
      errors.push(`${routeLabel} ${policyName}.addHeaders contains invalid header name: ${headerName}`);
    }
  }

  for (const headerName of policy.removeHeaders ?? []) {
    if (!isValidHttpHeaderName(headerName)) {
      errors.push(`${routeLabel} ${policyName}.removeHeaders contains invalid header name: ${headerName}`);
    }
  }

  return errors;
}

function validateRoute(route: DownstreamRouteConfig, index: number): string[] {
  const routeLabel = `route[${index}] ${route.method} ${route.gatewayPath}`;
  const errors: string[] = [];

  if (route.requestHost !== undefined) {
    try {
      const normalizedRequestHost = normalizeConfiguredRequestHost(
        route.requestHost,
      );

      if (normalizedRequestHost !== route.requestHost) {
        errors.push(
          `${routeLabel} requestHost must be canonical: ${normalizedRequestHost}`,
        );
      }
    } catch (error) {
      errors.push(
        `${routeLabel} ${
          error instanceof Error
            ? error.message
            : "requestHost is invalid"
        }`,
      );
    }
  }

  if (!route.serviceName.trim()) {
    errors.push(`${routeLabel} serviceName is required`);
  }

  if (!route.gatewayPath.startsWith("/")) {
    errors.push(`${routeLabel} gatewayPath must start with /`);
  }

  if (!SUPPORTED_HTTP_METHODS.has(route.method)) {
    errors.push(`${routeLabel} method is not supported`);
  }

  errors.push(...validateDownstreamUrl(routeLabel, route.downstreamUrl));
  errors.push(...validateWeightedUpstreams(routeLabel, route));

  if (route.policies.timeout.enabled && !isPositiveInteger(route.policies.timeout.timeoutMs)) {
    errors.push(`${routeLabel} policies.timeout.timeoutMs must be a positive integer`);
  }

  if (route.policies.cache.enabled && !isPositiveInteger(route.policies.cache.ttlSeconds)) {
    errors.push(`${routeLabel} policies.cache.ttlSeconds must be a positive integer`);
  }

  if (route.policies.rateLimit.enabled) {
    if (!isPositiveInteger(route.policies.rateLimit.limit)) {
      errors.push(`${routeLabel} policies.rateLimit.limit must be a positive integer`);
    }

    if (!isPositiveInteger(route.policies.rateLimit.windowMs)) {
      errors.push(`${routeLabel} policies.rateLimit.windowMs must be a positive integer`);
    }
  }

  errors.push(
    ...validateHeaderTransformPolicy(
      routeLabel,
      "requestTransform",
      route.policies.requestTransform,
    ),
  );

  errors.push(
    ...validateHeaderTransformPolicy(
      routeLabel,
      "responseTransform",
      route.policies.responseTransform,
    ),
  );

  if (!isNonNegativeInteger(route.policies.retry.attempts)) {
    errors.push(`${routeLabel} policies.retry.attempts must be a non-negative integer`);
  }

  if (route.policies.retry.enabled) {
    if (route.policies.retry.attempts === 0) {
      errors.push(`${routeLabel} policies.retry.attempts must be greater than 0 when retry is enabled`);
    }

    if (route.policies.retry.retryOnStatuses.length === 0) {
      errors.push(`${routeLabel} policies.retry.retryOnStatuses must not be empty when retry is enabled`);
    }
  }

  for (const statusCode of route.policies.retry.retryOnStatuses) {
    if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
      errors.push(`${routeLabel} policies.retry.retryOnStatuses contains invalid HTTP status: ${statusCode}`);
    }
  }

  return errors;
}

export function validateDownstreamRoutes<T extends readonly DownstreamRouteConfig[]>(
  routes: T,
): T {
  const errors: string[] = [];
  const routeKeys = new Set<string>();

  for (const [index, route] of routes.entries()) {
    const routeKey = buildRouteIdentityKey(route);

    if (routeKeys.has(routeKey)) {
      errors.push(
        `Duplicate downstream route config: ${formatRouteIdentityLabel(route)}`,
      );
    }

    routeKeys.add(routeKey);
    errors.push(...validateRoute(route, index));
  }

  if (errors.length > 0) {
    throw new Error(`Invalid downstream route configuration:\n${errors.join("\n")}`);
  }

  return routes;
}
