import type {
  GatewayRouteMethod,
  PrismaClient,
} from "../generated/prisma/index.js";
import type { ApiKeyAuthSource } from "../middlewares/api-key-auth.middleware.js";

export type ApiUsageCacheStatus = "HIT" | "MISS" | "BYPASS";

export type RecordApiUsageEventInput = {
  requestId: string;
  routePath: string;
  routeMethod: GatewayRouteMethod;
  statusCode: number;
  durationMs: number;
  cacheStatus?: ApiUsageCacheStatus;
  apiKeyAuthSource?: ApiKeyAuthSource;
  apiKeyId?: string;
  consumerId?: string;
  occurredAt?: Date;
};

export type ApiUsageRecorder = {
  record(input: RecordApiUsageEventInput): Promise<void>;
};

export function createPrismaApiUsageRecorder(
  prisma: PrismaClient,
): ApiUsageRecorder {
  return {
    async record(input) {
      await prisma.apiUsageEvent.create({
        data: {
          requestId: input.requestId,
          routePath: input.routePath,
          routeMethod: input.routeMethod,
          statusCode: input.statusCode,
          durationMs: input.durationMs,
          cacheStatus: input.cacheStatus,
          apiKeyAuthSource: input.apiKeyAuthSource,
          apiKeyId: input.apiKeyId,
          consumerId: input.consumerId,
          ...(input.occurredAt ? { occurredAt: input.occurredAt } : {}),
        },
      });
    },
  };
}
