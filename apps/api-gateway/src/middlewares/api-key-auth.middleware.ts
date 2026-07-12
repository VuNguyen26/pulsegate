import type {
  FastifyReply,
  FastifyRequest,
  HookHandlerDoneFunction,
} from "fastify";

import {
  env,
} from "../config/env.js";
import {
  recordRequestTracingOutcome,
} from "./tracing.middleware.js";

export type ApiKeyAuthSource = "env" | "database";

export type ApiKeyVerificationResult =
  | {
      valid: true;
      source: ApiKeyAuthSource;
      apiKeyId?: string;
      consumerId?: string;
    }
  | {
      valid: false;
      source?: ApiKeyAuthSource;
      reason?: string;
    };

export type ApiKeyAuthVerifier = (
  apiKey: string,
) => ApiKeyVerificationResult | Promise<ApiKeyVerificationResult>;

export type ApiKeyAuthMiddlewareOptions = {
  headerName?: string;
  verifier?: ApiKeyAuthVerifier;
};

declare module "fastify" {
  interface FastifyRequest {
    apiKey?: string;
    apiKeyId?: string;
    apiConsumerId?: string;
    apiKeyAuthSource?: ApiKeyAuthSource;
  }
}

function getHeaderValue(
  request: FastifyRequest,
  headerName: string,
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

function verifyEnvApiKey(apiKey: string): ApiKeyVerificationResult {
  if (env.API_KEYS.includes(apiKey)) {
    return {
      valid: true,
      source: "env",
    };
  }

  return {
    valid: false,
    source: "env",
    reason: "API_KEY_INVALID",
  };
}

function sendMissingApiKeyResponse(
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  recordRequestTracingOutcome(request, {
    errorCode: "API_KEY_MISSING",
    rejectionReason: "API_KEY_MISSING",
  });

  reply.status(401).send({
    error: {
      code: "API_KEY_MISSING",
      message: "API key is required",
      requestId: request.id,
    },
  });
}

function sendInvalidApiKeyResponse(
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  recordRequestTracingOutcome(request, {
    errorCode: "API_KEY_INVALID",
    rejectionReason: "API_KEY_INVALID",
  });

  reply.status(403).send({
    error: {
      code: "API_KEY_INVALID",
      message: "API key is invalid",
      requestId: request.id,
    },
  });
}

function attachApiKeyContext(
  request: FastifyRequest,
  apiKey: string,
  verification: Extract<ApiKeyVerificationResult, { valid: true }>,
): void {
  request.apiKey = apiKey;
  request.apiKeyId = verification.apiKeyId;
  request.apiConsumerId = verification.consumerId;
  request.apiKeyAuthSource = verification.source;
}

export function createApiKeyAuthMiddleware(
  options: ApiKeyAuthMiddlewareOptions = {},
) {
  const headerName = options.headerName ?? env.API_KEY_HEADER;
  const verifier = options.verifier ?? verifyEnvApiKey;

  return async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const apiKey = getHeaderValue(request, headerName);

    if (!apiKey) {
      sendMissingApiKeyResponse(request, reply);
      return;
    }

    const verification = await verifier(apiKey);

    if (!verification.valid) {
      sendInvalidApiKeyResponse(request, reply);
      return;
    }

    attachApiKeyContext(request, apiKey, verification);
  };
}

export function apiKeyAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
): void {
  const apiKey = getHeaderValue(request, env.API_KEY_HEADER);

  if (!apiKey) {
    sendMissingApiKeyResponse(request, reply);
    return;
  }

  const verification = verifyEnvApiKey(apiKey);

  if (!verification.valid) {
    sendInvalidApiKeyResponse(request, reply);
    return;
  }

  attachApiKeyContext(request, apiKey, verification);

  done();
}