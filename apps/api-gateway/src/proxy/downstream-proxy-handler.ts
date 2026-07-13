import type {
  FastifyReply,
  FastifyRequest,
  HookHandlerDoneFunction,
} from "fastify";

import type {
  ApiUsageCacheStatus,
  ApiUsageRecorder,
} from "../api-usage/api-usage-recorder.js";
import type { ApiRejectedEventRecorder } from "../api-rejections/api-rejected-event-recorder.js";
import type {
  UsageQuotaChecker,
  UsageQuotaCheckResult,
} from "../usage-plans/usage-quota-checker.js";

import type { ResponseCacheStore } from "../cache/redis-response-cache-store.js";
import type { DownstreamRouteConfig } from "../config/downstream-routes.js";
import type { WeightedRandomSource } from "../config/weighted-upstream-selector.js";
import { resolveDownstreamTarget } from "./downstream-target-resolver.js";
import { DownstreamServiceError } from "../errors/downstream-service-error.js";
import {
  buildAuthRejectionRecordingFailedLogPayload,
  buildQuotaRejectionRecordingFailedLogPayload,
  buildRateLimitRejectionRecordingFailedLogPayload,
  buildResponseCacheStoreFailedLogPayload,
  buildUsageRecordingFailedLogPayload,
} from "../observability/logging.js";
import { apiKeyAuthMiddleware } from "../middlewares/api-key-auth.middleware.js";
import { jwtAuthMiddleware } from "../middlewares/jwt-auth.middleware.js";
import {
  createRateLimitMiddleware,
  type RateLimitStore,
} from "../middlewares/rate-limit.middleware.js";
import {
  buildResponseCacheKey,
  resolveRouteCachePolicy,
} from "../policies/cache.policy.js";
import { resolveRouteRateLimitPolicy } from "../policies/rate-limit.policy.js";
import { applyRequestHeaderTransform } from "../policies/request-transform.policy.js";
import { applyResponseHeaderTransform } from "../policies/response-transform.policy.js";
import {
  executeWithRetry,
  shouldRetryStatus,
} from "../policies/retry.policy.js";
import {
  createDownstreamTimeout,
} from "../policies/timeout.policy.js";
import {
  recordRequestTracingOutcome,
  startDownstreamClientTracingSpan,
} from "../middlewares/tracing.middleware.js";
import {
  buildConfiguredRoutePolicyPath,
} from "../config/route-identity.js";
import type {
  RouteRuntimeRegistry,
  ServiceDiscoveryRandomSource,
} from "../runtime/route-runtime-registry.js";

export { buildResponseCacheKey };

function getUsageDurationMs(startedAtMs: number): number {
  return Math.max(0, Date.now() - startedAtMs);
}

async function recordApiUsageEvent(options: {
  usageRecorder?: ApiUsageRecorder;
  request: FastifyRequest;
  routeConfig: DownstreamRouteConfig;
  statusCode: number;
  cacheStatus: ApiUsageCacheStatus;
  startedAtMs: number;
}): Promise<void> {
  if (!options.usageRecorder) {
    return;
  }

  try {
    await options.usageRecorder.record({
      requestId: options.request.id,
      routePath: options.routeConfig.gatewayPath,
      routeMethod: options.routeConfig.method,
      statusCode: options.statusCode,
      durationMs: getUsageDurationMs(options.startedAtMs),
      cacheStatus: options.cacheStatus,
      apiKeyAuthSource: options.request.apiKeyAuthSource,
      apiKeyId: options.request.apiKeyId,
      consumerId: options.request.apiConsumerId,
    });
  } catch {
    options.request.log.error(
      buildUsageRecordingFailedLogPayload(
        options.request.id,
        options.routeConfig.gatewayPath,
      ),
      "Failed to record API usage event",
    );
  }
}

export type DownstreamRouteConfigResolver = (
  request: FastifyRequest,
) => DownstreamRouteConfig | null;

type RouteResolverOptions = {
  registeredRouteConfig?: DownstreamRouteConfig;
  routeConfigResolver?: DownstreamRouteConfigResolver;
  routeRuntimeRegistry?: RouteRuntimeRegistry;
};

function applyHeadersToReply(
  reply: FastifyReply,
  headers: Record<string, string>,
): void {
  for (const [headerName, headerValue] of Object.entries(headers)) {
    reply.header(headerName, headerValue);
  }
}

const OUTBOUND_TRACE_HEADER_NAMES =
  new Set([
    "baggage",
    "traceparent",
    "tracestate",
  ]);

function applyDownstreamTraceHeaders(
  transformedHeaders:
    Record<string, string>,
  traceHeaders:
    Record<string, string>,
): Record<string, string> {
  const outboundHeaders = {
    ...transformedHeaders,
  };

  for (const headerName of
    Object.keys(outboundHeaders)) {
    if (
      OUTBOUND_TRACE_HEADER_NAMES.has(
        headerName.toLowerCase(),
      )
    ) {
      delete outboundHeaders[
        headerName
      ];
    }
  }

  return {
    ...outboundHeaders,
    ...traceHeaders,
  };
}
function shouldRetryDownstreamError(

  error: unknown,
  retryOnStatuses: number[],
): boolean {
  return (
    error instanceof DownstreamServiceError &&
    retryOnStatuses.includes(error.statusCode)
  );
}

function isServiceInstanceHealthFailure(
  error: DownstreamServiceError,
): boolean {
  return (
    error.code ===
      "DOWNSTREAM_SERVICE_UNAVAILABLE" ||
    error.code === "DOWNSTREAM_TIMEOUT" ||
    (
      error.code === "DOWNSTREAM_HTTP_ERROR" &&
      error.statusCode === 502
    )
  );
}

function toServiceDisplayName(serviceName: string): string {
  return serviceName
    .split("-")
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildDownstreamHttpErrorMessage(
  routeConfig: DownstreamRouteConfig,
): string {
  return `${toServiceDisplayName(routeConfig.serviceName)} returned an error`;
}

function buildDownstreamTimeoutMessage(
  routeConfig: DownstreamRouteConfig,
): string {
  return `${toServiceDisplayName(routeConfig.serviceName)} did not respond in time`;
}

function buildDownstreamUnavailableMessage(
  routeConfig: DownstreamRouteConfig,
): string {
  return `${toServiceDisplayName(routeConfig.serviceName)} is currently unavailable`;
}

function buildDownstreamInvalidResponseMessage(
  routeConfig: DownstreamRouteConfig,
): string {
  return `${toServiceDisplayName(routeConfig.serviceName)} returned an invalid response`;
}

export function buildRouteNotFoundResponse(requestId: string) {
  return {
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "Route not found",
      requestId,
    },
  };
}

type UsageQuotaExceededCheckResult = Extract<
  UsageQuotaCheckResult,
  {
    allowed: false;
  }
>;

function buildQuotaExceededDetails(quotaCheck: UsageQuotaExceededCheckResult) {
  const resetAt = quotaCheck.windowEndsAt.toISOString();

  return {
    quotaLimit: quotaCheck.quotaLimit,
    quotaWindow: quotaCheck.quotaWindow,
    usedRequests: quotaCheck.usedRequests,
    remainingRequests: Math.max(
      quotaCheck.quotaLimit - quotaCheck.usedRequests,
      0,
    ),
    windowStartedAt: quotaCheck.windowStartedAt.toISOString(),
    windowEndsAt: quotaCheck.windowEndsAt.toISOString(),
    resetAt,
  };
}

export function buildQuotaExceededResponse(
  requestId: string,
  quotaCheck?: UsageQuotaExceededCheckResult,
) {
  const details = quotaCheck ? buildQuotaExceededDetails(quotaCheck) : undefined;

  return {
    error: {
      code: "QUOTA_EXCEEDED",
      message:
        "API key quota has been exceeded for the current quota window.",
      ...(details ? { details } : {}),
      requestId,
    },
  };
}

async function recordQuotaRejectedEvent(options: {
  rejectedEventRecorder?: ApiRejectedEventRecorder;
  request: FastifyRequest;
  routeConfig: DownstreamRouteConfig;
  quotaCheck: UsageQuotaExceededCheckResult;
}): Promise<void> {
  if (!options.rejectedEventRecorder) {
    return;
  }

  try {
    await options.rejectedEventRecorder.record({
      requestId: options.request.id,
      routePath: options.routeConfig.gatewayPath,
      routeMethod: options.routeConfig.method,
      statusCode: 429,
      rejectionReason: "QUOTA_EXCEEDED",
      apiKeyAuthSource: options.request.apiKeyAuthSource,
      apiKeyId: options.request.apiKeyId,
      consumerId: options.request.apiConsumerId,
      metadata: buildQuotaExceededDetails(options.quotaCheck),
    });
  } catch {
    options.request.log.error(
      buildQuotaRejectionRecordingFailedLogPayload(
        options.request.id,
        options.routeConfig.gatewayPath,
      ),
      "Failed to record quota rejected event",
    );
  }
}

function readNumericReplyHeader(
  reply: FastifyReply,
  headerName: string,
): number | undefined {
  const headerValue = reply.getHeader(headerName);
  const firstValue = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (firstValue === undefined) {
    return undefined;
  }

  const parsedValue = Number(firstValue);

  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function buildRateLimitRejectedMetadata(options: {
  identityType: string;
  limit?: number;
  remaining?: number;
  resetAtSeconds?: number;
  retryAfterSeconds?: number;
}) {
  return {
    identityType: options.identityType,
    ...(options.limit !== undefined ? { limit: options.limit } : {}),
    ...(options.remaining !== undefined
      ? { remaining: options.remaining }
      : {}),
    ...(options.retryAfterSeconds !== undefined
      ? { retryAfterSeconds: options.retryAfterSeconds }
      : {}),
    ...(options.resetAtSeconds !== undefined
      ? { resetAt: new Date(options.resetAtSeconds * 1000).toISOString() }
      : {}),
  };
}

async function recordRateLimitRejectedEvent(options: {
  rejectedEventRecorder?: ApiRejectedEventRecorder;
  request: FastifyRequest;
  reply: FastifyReply;
  routeConfig: DownstreamRouteConfig;
  identityType: string;
}): Promise<void> {
  if (!options.rejectedEventRecorder) {
    return;
  }

  try {
    await options.rejectedEventRecorder.record({
      requestId: options.request.id,
      routePath: options.routeConfig.gatewayPath,
      routeMethod: options.routeConfig.method,
      statusCode: 429,
      rejectionReason: "RATE_LIMIT_EXCEEDED",
      apiKeyAuthSource: options.request.apiKeyAuthSource,
      apiKeyId: options.request.apiKeyId,
      consumerId: options.request.apiConsumerId,
      metadata: buildRateLimitRejectedMetadata({
        identityType: options.identityType,
        limit: readNumericReplyHeader(options.reply, "x-ratelimit-limit"),
        remaining: readNumericReplyHeader(
          options.reply,
          "x-ratelimit-remaining",
        ),
        resetAtSeconds: readNumericReplyHeader(
          options.reply,
          "x-ratelimit-reset",
        ),
        retryAfterSeconds: readNumericReplyHeader(
          options.reply,
          "retry-after",
        ),
      }),
    });
  } catch {
    options.request.log.error(
      buildRateLimitRejectionRecordingFailedLogPayload(
        options.request.id,
        options.routeConfig.gatewayPath,
      ),
      "Failed to record rate limit rejected event",
    );
  }
}

type AuthRejectionType = "api-key" | "jwt";

type AuthRejectionReason =
  | "API_KEY_MISSING"
  | "API_KEY_INVALID"
  | "JWT_TOKEN_MISSING"
  | "JWT_TOKEN_INVALID";

function resolveAuthRejectionReason(options: {
  authType: AuthRejectionType;
  statusCode: number;
}): AuthRejectionReason | undefined {
  if (options.authType === "api-key") {
    if (options.statusCode === 401) {
      return "API_KEY_MISSING";
    }

    if (options.statusCode === 403) {
      return "API_KEY_INVALID";
    }

    return undefined;
  }

  if (options.statusCode === 401) {
    return "JWT_TOKEN_MISSING";
  }

  if (options.statusCode === 403) {
    return "JWT_TOKEN_INVALID";
  }

  return undefined;
}

async function recordAuthRejectedEvent(options: {
  rejectedEventRecorder?: ApiRejectedEventRecorder;
  request: FastifyRequest;
  reply: FastifyReply;
  routeConfig: DownstreamRouteConfig;
  authType: AuthRejectionType;
}): Promise<void> {
  if (!options.rejectedEventRecorder) {
    return;
  }

  const rejectionReason = resolveAuthRejectionReason({
    authType: options.authType,
    statusCode: options.reply.statusCode,
  });

  if (!rejectionReason) {
    return;
  }

  try {
    await options.rejectedEventRecorder.record({
      requestId: options.request.id,
      routePath: options.routeConfig.gatewayPath,
      routeMethod: options.routeConfig.method,
      statusCode: options.reply.statusCode,
      rejectionReason,
      apiKeyAuthSource: options.request.apiKeyAuthSource,
      apiKeyId: options.request.apiKeyId,
      consumerId: options.request.apiConsumerId,
      metadata: {
        authType: options.authType,
      },
    });
  } catch {
    options.request.log.error(
      buildAuthRejectionRecordingFailedLogPayload(
        options.request.id,
        options.routeConfig.gatewayPath,
        options.authType,
      ),
      "Failed to record auth rejected event",
    );
  }
}

export function resolveRuntimeRouteConfig(
  registeredRouteConfig: DownstreamRouteConfig,
  routeRuntimeRegistry?: RouteRuntimeRegistry,
): DownstreamRouteConfig | null {
  if (!routeRuntimeRegistry) {
    return registeredRouteConfig;
  }

  return routeRuntimeRegistry.findRoute(
    registeredRouteConfig.method,
    registeredRouteConfig.gatewayPath,
  );
}

function resolveDownstreamRouteConfig(
  request: FastifyRequest,
  options: RouteResolverOptions,
): DownstreamRouteConfig | null {
  if (options.routeConfigResolver) {
    return options.routeConfigResolver(request);
  }

  if (!options.registeredRouteConfig) {
    return null;
  }

  return resolveRuntimeRouteConfig(
    options.registeredRouteConfig,
    options.routeRuntimeRegistry,
  );
}

export type RuntimePreHandlerMiddleware = (
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
) => void | Promise<void>;

function isPromiseLike(value: unknown): value is PromiseLike<void> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as PromiseLike<void>).then === "function"
  );
}

function runRuntimePreHandler(
  middleware: RuntimePreHandlerMiddleware,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const finish: HookHandlerDoneFunction = (error?: Error) => {
      if (settled) {
        return;
      }

      settled = true;

      if (error) {
        reject(error);
        return;
      }

      resolve();
    };

    try {
      const result = middleware(request, reply, finish);

      if (isPromiseLike(result)) {
        result.then(() => finish(), finish);
        return;
      }

      if (reply.sent) {
        finish();
      }
    } catch (error) {
      reject(error);
    }
  });
}

export function createRuntimePolicyPreHandler(options: RouteResolverOptions & {
  rateLimitStore: RateLimitStore;
  apiKeyAuthMiddleware?: RuntimePreHandlerMiddleware;
  usageQuotaChecker?: UsageQuotaChecker;
  rejectedEventRecorder?: ApiRejectedEventRecorder;
}) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const runtimeRouteConfig = resolveDownstreamRouteConfig(request, options);

    if (!runtimeRouteConfig) {
      recordRequestTracingOutcome(request, {
        errorCode: "ROUTE_NOT_FOUND",
        rejectionReason: "ROUTE_NOT_FOUND",
      });

      return reply
        .status(404)
        .send(
          buildRouteNotFoundResponse(
            request.id,
          ),
        );
    }

    const routePolicies = runtimeRouteConfig.policies;

    if (routePolicies.auth.requireApiKey) {
      const requireApiKey =
        options.apiKeyAuthMiddleware ?? apiKeyAuthMiddleware;

      await runRuntimePreHandler(requireApiKey, request, reply);

      if (reply.sent) {
        await recordAuthRejectedEvent({
          rejectedEventRecorder: options.rejectedEventRecorder,
          request,
          reply,
          routeConfig: runtimeRouteConfig,
          authType: "api-key",
        });

        return;
      }
    }

    const rateLimit = resolveRouteRateLimitPolicy({
      policy: routePolicies.rateLimit,
      routePath: buildConfiguredRoutePolicyPath(runtimeRouteConfig),
      identityType: "api-key",
      store: options.rateLimitStore,
    });

    if (rateLimit.enabled) {
      const rateLimitMiddleware = createRateLimitMiddleware({
        limit: rateLimit.limit,
        windowMs: rateLimit.windowMs,
        routePath: rateLimit.routePath,
        identityType: rateLimit.identityType,
        store: rateLimit.store,
      });

      await runRuntimePreHandler(rateLimitMiddleware, request, reply);

      if (reply.sent) {
        if (reply.statusCode === 429) {
          await recordRateLimitRejectedEvent({
            rejectedEventRecorder: options.rejectedEventRecorder,
            request,
            reply,
            routeConfig: runtimeRouteConfig,
            identityType: rateLimit.identityType,
          });
        }

        return;
      }
    }

    if (routePolicies.auth.requireJwt) {
      await runRuntimePreHandler(jwtAuthMiddleware, request, reply);

      if (reply.sent) {
        await recordAuthRejectedEvent({
          rejectedEventRecorder: options.rejectedEventRecorder,
          request,
          reply,
          routeConfig: runtimeRouteConfig,
          authType: "jwt",
        });

        return;
      }
    }

    if (
      request.apiKeyAuthSource === "database" &&
      request.apiKeyId &&
      options.usageQuotaChecker
    ) {
      const quotaCheck = await options.usageQuotaChecker.checkApiKeyQuota(
        request.apiKeyId,
      );

      if (!quotaCheck.allowed) {
        recordRequestTracingOutcome(request, {
          errorCode: "QUOTA_EXCEEDED",
          rejectionReason: "QUOTA_EXCEEDED",
        });

        await recordQuotaRejectedEvent({
          rejectedEventRecorder: options.rejectedEventRecorder,
          request,
          routeConfig: runtimeRouteConfig,
          quotaCheck,
        });

        return reply
          .status(429)
          .send(buildQuotaExceededResponse(request.id, quotaCheck));
      }
    }
  };
}
export function createDownstreamProxyHandler(options: RouteResolverOptions & {
  responseCacheStore?: ResponseCacheStore;
  responseCacheTtlSeconds?: number;
  usageRecorder?: ApiUsageRecorder;
  weightedRandomSource?: WeightedRandomSource;
  serviceDiscoveryRandomSource?: ServiceDiscoveryRandomSource;
}) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const usageStartedAtMs = Date.now();
    const routeConfig = resolveDownstreamRouteConfig(request, options);

    if (!routeConfig) {
      recordRequestTracingOutcome(request, {
        errorCode: "ROUTE_NOT_FOUND",
        rejectionReason: "ROUTE_NOT_FOUND",
      });

      return reply
        .status(404)
        .send(
          buildRouteNotFoundResponse(
            request.id,
          ),
        );
    }

    const routePolicies = routeConfig.policies;

    const responseCache = resolveRouteCachePolicy({
      policy: routePolicies.cache,
      store: options.responseCacheStore,
      ttlSecondsOverride: options.responseCacheTtlSeconds,
    });

    const cacheKey = buildResponseCacheKey(
      routeConfig.method,
      buildConfiguredRoutePolicyPath(routeConfig),
    );

    const transformedResponseHeaders = applyResponseHeaderTransform(
      {},
      routePolicies.responseTransform,
    );

    if (responseCache.enabled && responseCache.store) {
      const cachedResponse = await responseCache.store.get(cacheKey);

      if (cachedResponse.hit) {
        applyHeadersToReply(reply, transformedResponseHeaders);
        reply.header("x-cache", "HIT");

        await recordApiUsageEvent({
          usageRecorder: options.usageRecorder,
          request,
          routeConfig,
          statusCode: cachedResponse.value.statusCode,
          cacheStatus: "HIT",
          startedAtMs: usageStartedAtMs,
        });

        return reply
          .status(cachedResponse.value.statusCode)
          .send(cachedResponse.value.body);
      }
    }

    const transformedDownstreamRequestHeaders =
      applyRequestHeaderTransform(
        {
          "x-request-id": request.id,
        },
        routePolicies.requestTransform,
      );

    const fixedLegacyTarget =
      routeConfig.serviceInstances ===
      undefined
        ? resolveDownstreamTarget({
            routeConfig,
            routeRuntimeRegistry:
              options.routeRuntimeRegistry,
            weightedRandomSource:
              options.weightedRandomSource,
            serviceDiscoveryRandomSource:
              options.serviceDiscoveryRandomSource,
          })
        : null;

    const excludedServiceInstanceBaseUrls =
      new Set<string>();

    let stopRetrying = false;
    let downstreamAttempt = 0;
    let firstTargetIdentity:
      | string
      | undefined;

    const fetchDownstreamResponse = async (): Promise<Response> => {
      const target =
        fixedLegacyTarget ??
        resolveDownstreamTarget({
          routeConfig,
          routeRuntimeRegistry:
            options.routeRuntimeRegistry,
          weightedRandomSource:
            options.weightedRandomSource,
          serviceDiscoveryRandomSource:
            options.serviceDiscoveryRandomSource,
          excludedServiceInstanceBaseUrls: [
            ...excludedServiceInstanceBaseUrls,
          ],
        });

      if (!target) {
        stopRetrying = true;

        throw new DownstreamServiceError({
          code:
            "DOWNSTREAM_SERVICE_UNAVAILABLE",
          message:
            buildDownstreamUnavailableMessage(
              routeConfig,
            ),
          service:
            routeConfig.serviceName,
          statusCode: 503,
        });
      }

      const downstreamTimeout =
        createDownstreamTimeout(
          routePolicies.timeout,
        );

      const currentAttempt =
        downstreamAttempt;

      downstreamAttempt += 1;

      const targetIdentity =
        target.serviceInstanceBaseUrl ??
        target.downstreamUrl;

      const failover =
        firstTargetIdentity !== undefined &&
        firstTargetIdentity !==
          targetIdentity;

      firstTargetIdentity ??=
        targetIdentity;

      const downstreamTrace =
        startDownstreamClientTracingSpan(
          request,
          {
            method: routeConfig.method,
            serviceName:
              routeConfig.serviceName,
            retryAttempt:
              currentAttempt,
            failover,
          },
        );

      const downstreamRequestHeaders =
        applyDownstreamTraceHeaders(
          transformedDownstreamRequestHeaders,
          downstreamTrace?.headers ?? {},
        );
const recordHealthFailure = (
        error: DownstreamServiceError,
      ): void => {
        if (
          !target.serviceInstanceBaseUrl ||
          !isServiceInstanceHealthFailure(
            error,
          )
        ) {
          return;
        }

        options.routeRuntimeRegistry
          ?.recordServiceInstanceFailure(
            routeConfig.serviceName,
            target.serviceInstanceBaseUrl,
          );

        excludedServiceInstanceBaseUrls.add(
          target.serviceInstanceBaseUrl,
        );
      };

      try {
        const downstreamResponse =
          await fetch(
            target.downstreamUrl,
            {
              method:
                routeConfig.method,
              headers:
                downstreamRequestHeaders,
              signal:
                downstreamTimeout.signal,
            },
          );

        downstreamTrace?.recordResponse(
          downstreamResponse.status,
        );

        if (
          target.serviceInstanceBaseUrl &&
          downstreamResponse.status < 500
        ) {
          options.routeRuntimeRegistry
            ?.recordServiceInstanceSuccess(
              routeConfig.serviceName,
              target.serviceInstanceBaseUrl,
            );
        }

        if (!downstreamResponse.ok) {
          const downstreamError =
            new DownstreamServiceError({
              code:
                "DOWNSTREAM_HTTP_ERROR",
              message:
                buildDownstreamHttpErrorMessage(
                  routeConfig,
                ),
              service:
                routeConfig.serviceName,
              statusCode:
                downstreamResponse.status >= 500
                  ? 502
                  : downstreamResponse.status,
            });

          recordHealthFailure(
            downstreamError,
          );

          throw downstreamError;
        }

        return downstreamResponse;
      } catch (error) {
        if (
          error instanceof
          DownstreamServiceError
        ) {
          if (
            error.code ===
              "DOWNSTREAM_HTTP_ERROR" ||
            error.code ===
              "DOWNSTREAM_SERVICE_UNAVAILABLE" ||
            error.code ===
              "DOWNSTREAM_TIMEOUT"
          ) {
            downstreamTrace?.recordError(
              error.code,
            );
          }

          throw error;
        }

        const downstreamError =
          error instanceof Error &&
          error.name === "AbortError"
            ? new DownstreamServiceError({
                code:
                  "DOWNSTREAM_TIMEOUT",
                message:
                  buildDownstreamTimeoutMessage(
                    routeConfig,
                  ),
                service:
                  routeConfig.serviceName,
                statusCode: 504,
                originalError: error,
              })
            : new DownstreamServiceError({
                code:
                  "DOWNSTREAM_SERVICE_UNAVAILABLE",
                message:
                  buildDownstreamUnavailableMessage(
                    routeConfig,
                  ),
                service:
                  routeConfig.serviceName,
                statusCode: 503,
                originalError: error,
              });

        downstreamTrace?.recordError(
          error instanceof Error &&
            error.name === "AbortError"
            ? "DOWNSTREAM_TIMEOUT"
            : "DOWNSTREAM_SERVICE_UNAVAILABLE",
        );
recordHealthFailure(
          downstreamError,
        );

        throw downstreamError;
      } finally {
        downstreamTimeout.cleanup();
      }
    };

    const response =
      await executeWithRetry({
        method: routeConfig.method,
        policy: routePolicies.retry,
        operation:
          fetchDownstreamResponse,
        shouldRetryError: (error) =>
          !stopRetrying &&
          shouldRetryDownstreamError(
            error,
            routePolicies.retry
              .retryOnStatuses,
          ),
      });

    if (
      shouldRetryStatus(routePolicies.retry, response.status) &&
      routePolicies.retry.enabled
    ) {
      request.log.warn(
        {
          requestId: request.id,
          statusCode: response.status,
          route: routeConfig.gatewayPath,
        },
        "Received retryable downstream response after retry execution",
      );
    }

    let data: unknown;

    try {
      data = await response.json();
    } catch (error) {
      throw new DownstreamServiceError({
        code: "DOWNSTREAM_INVALID_RESPONSE",
        message: buildDownstreamInvalidResponseMessage(routeConfig),
        service: routeConfig.serviceName,
        statusCode: 502,
        originalError: error,
      });
    }

    if (responseCache.enabled && responseCache.store) {
      try {
        await responseCache.store.set(
          cacheKey,
          {
            statusCode: response.status,
            body: data,
          },
          {
            ttlSeconds: responseCache.ttlSeconds,
          },
        );
      } catch {
        request.log.error(
          buildResponseCacheStoreFailedLogPayload(
            request.id,
          ),
          "Failed to store response cache",
        );
      }
    }

    const cacheStatus: ApiUsageCacheStatus = responseCache.enabled
      ? "MISS"
      : "BYPASS";

    await recordApiUsageEvent({
      usageRecorder: options.usageRecorder,
      request,
      routeConfig,
      statusCode: response.status,
      cacheStatus,
      startedAtMs: usageStartedAtMs,
    });

    applyHeadersToReply(reply, transformedResponseHeaders);
    reply.header("x-cache", cacheStatus);

    return reply.status(response.status).send(data);
  };
}
