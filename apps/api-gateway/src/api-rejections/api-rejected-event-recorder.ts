import type {
  ApiRejectionReason,
  GatewayRouteMethod,
  Prisma,
  PrismaClient,
} from "../generated/prisma/index.js";
import type { ApiKeyAuthSource } from "../middlewares/api-key-auth.middleware.js";

export type RecordApiRejectedEventInput = {
  requestId: string;
  routePath?: string;
  routeMethod?: GatewayRouteMethod;
  statusCode: number;
  rejectionReason: ApiRejectionReason;
  apiKeyAuthSource?: ApiKeyAuthSource;
  apiKeyId?: string;
  consumerId?: string;
  metadata?: Prisma.InputJsonValue;
  occurredAt?: Date;
};

export type ApiRejectedEventRecorder = {
  record(input: RecordApiRejectedEventInput): Promise<void>;
};

export function createPrismaApiRejectedEventRecorder(
  prisma: PrismaClient,
): ApiRejectedEventRecorder {
  return {
    async record(input) {
      await prisma.apiRejectedEvent.create({
        data: {
          requestId: input.requestId,
          routePath: input.routePath,
          routeMethod: input.routeMethod,
          statusCode: input.statusCode,
          rejectionReason: input.rejectionReason,
          apiKeyAuthSource: input.apiKeyAuthSource,
          apiKeyId: input.apiKeyId,
          consumerId: input.consumerId,
          metadata: input.metadata,
          ...(input.occurredAt ? { occurredAt: input.occurredAt } : {}),
        },
      });
    },
  };
}