import type { FastifyReply, FastifyRequest } from "fastify";
import { jwtVerify, type JWTPayload } from "jose";

import {
  env,
} from "../config/env.js";
import {
  recordRequestTracingOutcome,
} from "./tracing.middleware.js";

declare module "fastify" {
  interface FastifyRequest {
    jwtPayload?: JWTPayload;
  }
}

function getAuthorizationHeader(request: FastifyRequest): string | undefined {
  const value = request.headers.authorization;

  if (typeof value !== "string") {
    return undefined;
  }

  return value;
}

export function extractBearerToken(
  authorizationHeader: string | undefined
): string | undefined {
  if (!authorizationHeader) {
    return undefined;
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return undefined;
  }

  const token = match[1]?.trim();

  if (!token) {
    return undefined;
  }

  return token;
}

export async function verifyJwtToken(token: string): Promise<JWTPayload> {
  const secretKey = new TextEncoder().encode(env.JWT_SECRET);

  const result = await jwtVerify(token, secretKey, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });

  return result.payload;
}

export async function jwtAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authorizationHeader = getAuthorizationHeader(request);
  const token = extractBearerToken(authorizationHeader);

  if (!token) {
    recordRequestTracingOutcome(request, {
      errorCode: "JWT_TOKEN_MISSING",
      rejectionReason: "JWT_TOKEN_MISSING",
    });

    reply.status(401).send({
      error: {
        code: "JWT_TOKEN_MISSING",
        message: "Bearer token is required",
        requestId: request.id,
      },
    });
    return;
  }

  try {
    const payload = await verifyJwtToken(token);

    request.jwtPayload = payload;
  } catch (error) {
    recordRequestTracingOutcome(request, {
      errorCode: "JWT_TOKEN_INVALID",
      rejectionReason: "JWT_TOKEN_INVALID",
    });

    request.log.warn(
      {
        error,
        requestId: request.id,
      },
      "Invalid JWT token"
    );

    reply.status(403).send({
      error: {
        code: "JWT_TOKEN_INVALID",
        message: "Bearer token is invalid",
        requestId: request.id,
      },
    });
  }
}