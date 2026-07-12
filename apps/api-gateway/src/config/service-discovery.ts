import type {
  DownstreamRouteConfig,
  ServiceInstance,
  WeightedUpstream,
} from "./downstream-routes.js";

export const MAX_SERVICE_DISCOVERY_SERVICE_COUNT = 64;
export const MAX_SERVICE_INSTANCE_COUNT = 8;
export const MAX_SERVICE_NAME_LENGTH = 64;
export const MAX_SERVICE_INSTANCE_BASE_URL_LENGTH = 2048;

const SERVICE_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ServiceDiscoveryRouteConfig = Pick<
  DownstreamRouteConfig,
  "serviceName" | "downstreamUrl"
> & {
  weightedUpstreams?: readonly WeightedUpstream[];
  serviceInstances?: readonly ServiceInstance[];
};

export type ServiceDiscoveryServiceSnapshot = Readonly<{
  serviceName: string;
  instances: readonly ServiceInstance[];
}>;

export type ServiceDiscoverySnapshot = Readonly<{
  serviceCount: number;
  services: readonly ServiceDiscoveryServiceSnapshot[];
}>;

function fail(message: string): never {
  throw new Error(
    `Invalid service discovery configuration: ${message}`,
  );
}

function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function validateServiceDiscoveryServiceName(
  value: unknown,
): string {
  if (typeof value !== "string") {
    return fail("serviceName must be a string");
  }

  if (value.length === 0) {
    return fail("serviceName is required");
  }

  if (value.length > MAX_SERVICE_NAME_LENGTH) {
    return fail(
      `serviceName must not exceed ${MAX_SERVICE_NAME_LENGTH} characters`,
    );
  }

  if (!SERVICE_NAME_PATTERN.test(value)) {
    return fail(
      "serviceName must use canonical lowercase kebab-case",
    );
  }

  return value;
}

export function validateServiceInstanceBaseUrl(
  value: unknown,
): string {
  if (typeof value !== "string") {
    return fail("service instance baseUrl must be a string");
  }

  if (value.length === 0) {
    return fail("service instance baseUrl is required");
  }

  if (value.length > MAX_SERVICE_INSTANCE_BASE_URL_LENGTH) {
    return fail(
      `service instance baseUrl must not exceed ${MAX_SERVICE_INSTANCE_BASE_URL_LENGTH} characters`,
    );
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return fail("service instance baseUrl must be a valid URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return fail(
      "service instance baseUrl must use http or https",
    );
  }

  if (url.username || url.password) {
    return fail(
      "service instance baseUrl must not contain credentials",
    );
  }

  if (
    url.pathname !== "/" ||
    url.search.length > 0 ||
    url.hash.length > 0
  ) {
    return fail(
      "service instance baseUrl must contain only an origin",
    );
  }

  if (value !== url.origin) {
    return fail(
      `service instance baseUrl must be canonical: ${url.origin}`,
    );
  }

  return value;
}

function readServiceInstances(
  value: unknown,
): readonly ServiceInstance[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    return fail("serviceInstances must be an array");
  }

  if (value.length === 0) {
    return fail(
      "serviceInstances must contain at least one instance",
    );
  }

  if (value.length > MAX_SERVICE_INSTANCE_COUNT) {
    return fail(
      `serviceInstances must contain at most ${MAX_SERVICE_INSTANCE_COUNT} instances`,
    );
  }

  const baseUrls = new Set<string>();
  const instances: ServiceInstance[] = [];

  for (const [index, item] of value.entries()) {
    if (!isPlainObject(item)) {
      return fail(
        `serviceInstances[${index}] must be an object`,
      );
    }

    const baseUrl = validateServiceInstanceBaseUrl(
      item.baseUrl,
    );

    if (baseUrls.has(baseUrl)) {
      return fail(
        `serviceInstances contains duplicate baseUrl: ${baseUrl}`,
      );
    }

    baseUrls.add(baseUrl);
    instances.push(Object.freeze({ baseUrl }));
  }

  instances.sort((left, right) =>
    left.baseUrl.localeCompare(right.baseUrl),
  );

  return Object.freeze(instances);
}

function readDownstreamEndpoint(
  fieldName: string,
  value: unknown,
): URL {
  if (typeof value !== "string" || value.length === 0) {
    return fail(`${fieldName} must be a non-empty string`);
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return fail(`${fieldName} must be a valid URL`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return fail(`${fieldName} must use http or https`);
  }

  if (url.username || url.password) {
    return fail(`${fieldName} must not contain credentials`);
  }

  if (url.hash.length > 0) {
    return fail(`${fieldName} must not contain a fragment`);
  }

  return url;
}

function haveEqualBaseUrls(
  left: readonly ServiceInstance[],
  right: readonly ServiceInstance[],
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (instance, index) =>
        instance.baseUrl === right[index]?.baseUrl,
    )
  );
}

function validateDiscoveryRoute(
  route: ServiceDiscoveryRouteConfig,
): ServiceDiscoveryServiceSnapshot | null {
  const instances = readServiceInstances(
    route.serviceInstances,
  );

  if (instances === undefined) {
    return null;
  }

  const serviceName = validateServiceDiscoveryServiceName(
    route.serviceName,
  );

  const primaryEndpoint = readDownstreamEndpoint(
    `${serviceName} downstreamUrl`,
    route.downstreamUrl,
  );

  const instanceBaseUrls = new Set(
    instances.map((instance) => instance.baseUrl),
  );

  if (!instanceBaseUrls.has(primaryEndpoint.origin)) {
    return fail(
      `${serviceName} downstreamUrl origin must exist in serviceInstances`,
    );
  }

  if (route.weightedUpstreams !== undefined) {
    if (
      !Array.isArray(route.weightedUpstreams) ||
      route.weightedUpstreams.length === 0
    ) {
      return fail(
        `${serviceName} weightedUpstreams must not be empty`,
      );
    }

    const expectedPathAndQuery =
      `${primaryEndpoint.pathname}${primaryEndpoint.search}`;

    const weightedOrigins = new Set<string>();

    for (
      const [index, upstream] of
      route.weightedUpstreams.entries()
    ) {
      const endpoint = readDownstreamEndpoint(
        `${serviceName} weightedUpstreams[${index}].downstreamUrl`,
        upstream.downstreamUrl,
      );

      const pathAndQuery =
        `${endpoint.pathname}${endpoint.search}`;

      if (pathAndQuery !== expectedPathAndQuery) {
        return fail(
          `${serviceName} weighted upstream endpoints must share the primary path and query`,
        );
      }

      if (weightedOrigins.has(endpoint.origin)) {
        return fail(
          `${serviceName} weighted upstreams must use unique service instance origins`,
        );
      }

      weightedOrigins.add(endpoint.origin);
    }

    const configuredOrigins = [
      ...instanceBaseUrls,
    ].sort();

    const selectedOrigins = [
      ...weightedOrigins,
    ].sort();

    if (
      configuredOrigins.length !== selectedOrigins.length ||
      configuredOrigins.some(
        (origin, index) =>
          origin !== selectedOrigins[index],
      )
    ) {
      return fail(
        `${serviceName} weighted upstream origins must exactly match serviceInstances`,
      );
    }
  }

  return Object.freeze({
    serviceName,
    instances,
  });
}

export function buildServiceDiscoverySnapshot(
  routes: readonly ServiceDiscoveryRouteConfig[],
): ServiceDiscoverySnapshot {
  const servicesByName =
    new Map<string, ServiceDiscoveryServiceSnapshot>();

  for (const route of routes) {
    const service = validateDiscoveryRoute(route);

    if (!service) {
      continue;
    }

    const existing = servicesByName.get(
      service.serviceName,
    );

    if (
      existing &&
      !haveEqualBaseUrls(
        existing.instances,
        service.instances,
      )
    ) {
      return fail(
        `${service.serviceName} has conflicting serviceInstances across routes`,
      );
    }

    if (!existing) {
      servicesByName.set(service.serviceName, service);
    }
  }

  if (
    servicesByName.size >
    MAX_SERVICE_DISCOVERY_SERVICE_COUNT
  ) {
    return fail(
      `snapshot must contain at most ${MAX_SERVICE_DISCOVERY_SERVICE_COUNT} services`,
    );
  }

  const services = Object.freeze(
    [...servicesByName.values()].sort(
      (left, right) =>
        left.serviceName.localeCompare(right.serviceName),
    ),
  );

  return Object.freeze({
    serviceCount: services.length,
    services,
  });
}

export function composeServiceInstanceDownstreamUrl(
  instanceBaseUrl: string,
  downstreamUrl: string,
): string {
  const canonicalBaseUrl =
    validateServiceInstanceBaseUrl(instanceBaseUrl);

  const endpoint = readDownstreamEndpoint(
    "downstreamUrl",
    downstreamUrl,
  );

  const resolvedUrl = new URL(canonicalBaseUrl);

  resolvedUrl.pathname = endpoint.pathname;
  resolvedUrl.search = endpoint.search;

  return resolvedUrl.toString();
}
