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