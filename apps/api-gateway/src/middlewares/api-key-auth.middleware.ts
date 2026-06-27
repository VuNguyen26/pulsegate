import type {
  FastifyReply,
  FastifyRequest,
  HookHandlerDoneFunction,
} from "fastify";

import { env } from "../config/env.js";

declare module "fastify" {
  interface FastifyRequest {
    apiKey?: string;
  }
}

function getHeaderValue(
  request: FastifyRequest,
  headerName: string
): string | undefined {
  const value = request.headers[headerName.toLowerCase()];

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }

  return undefined;
}

export function apiKeyAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
): void {
  const apiKey = getHeaderValue(request, env.API_KEY_HEADER);

  if (!apiKey) {
    reply.status(401).send({
      error: {
        code: "API_KEY_MISSING",
        message: "API key is required",
        requestId: request.id,
      },
    });
    return;
  }

  if (!env.API_KEYS.includes(apiKey)) {
    reply.status(403).send({
      error: {
        code: "API_KEY_INVALID",
        message: "API key is invalid",
        requestId: request.id,
      },
    });
    return;
  }

  request.apiKey = apiKey;

  done();
}