import type { FastifyReply, FastifyRequest } from "fastify";
import { SignJWT } from "jose";
import { describe, expect, it, vi } from "vitest";

import { env } from "../config/env.js";
import {
  extractBearerToken,
  jwtAuthMiddleware,
  verifyJwtToken,
} from "./jwt-auth.middleware.js";

function createMockRequest(headers: FastifyRequest["headers"]): FastifyRequest {
  return {
    headers,
    id: "test-request-id",
    log: {
      warn: vi.fn(),
    },
  } as unknown as FastifyRequest;
}

function createMockReply() {
  const status = vi.fn();
  const send = vi.fn();

  const reply = {
    status,
    send,
  } as unknown as FastifyReply;

  status.mockReturnValue(reply);
  send.mockReturnValue(reply);

  return {
    reply,
    status,
    send,
  };
}

async function createValidJwtToken(): Promise<string> {
  const secretKey = new TextEncoder().encode(env.JWT_SECRET);
  const expiresAt = Math.floor(Date.now() / 1000) + env.JWT_EXPIRES_IN_SECONDS;

  return new SignJWT({
    role: "user",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject("user_123")
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(expiresAt)
    .sign(secretKey);
}

describe("extractBearerToken", () => {
  it("should return undefined when authorization header is missing", () => {
    const token = extractBearerToken(undefined);

    expect(token).toBeUndefined();
  });

  it("should return undefined when authorization header does not use Bearer scheme", () => {
    const token = extractBearerToken("Basic abc123");

    expect(token).toBeUndefined();
  });

  it("should return undefined when Bearer token is empty", () => {
    const token = extractBearerToken("Bearer   ");

    expect(token).toBeUndefined();
  });

  it("should extract token from valid Bearer authorization header", () => {
    const token = extractBearerToken("Bearer abc.def.ghi");

    expect(token).toBe("abc.def.ghi");
  });

  it("should extract token from lowercase bearer authorization header", () => {
    const token = extractBearerToken("bearer abc.def.ghi");

    expect(token).toBe("abc.def.ghi");
  });
});

describe("verifyJwtToken", () => {
  it("should verify a valid JWT token", async () => {
    const token = await createValidJwtToken();

    const payload = await verifyJwtToken(token);

    expect(payload.sub).toBe("user_123");
    expect(payload.role).toBe("user");
    expect(payload.iss).toBe(env.JWT_ISSUER);
    expect(payload.aud).toBe(env.JWT_AUDIENCE);
  });
});

describe("jwtAuthMiddleware", () => {
  it("should return 401 when Bearer token is missing", async () => {
    const request = createMockRequest({});
    const { reply, status, send } = createMockReply();

    await jwtAuthMiddleware(request, reply);

    expect(status).toHaveBeenCalledWith(401);
    expect(send).toHaveBeenCalledWith({
      error: {
        code: "JWT_TOKEN_MISSING",
        message: "Bearer token is required",
        requestId: "test-request-id",
      },
    });
    expect(request.jwtPayload).toBeUndefined();
  });

  it("should return 403 when Bearer token is invalid", async () => {
    const request = createMockRequest({
      authorization: "Bearer invalid-token",
    });
    const { reply, status, send } = createMockReply();

    await jwtAuthMiddleware(request, reply);

    expect(status).toHaveBeenCalledWith(403);
    expect(send).toHaveBeenCalledWith({
      error: {
        code: "JWT_TOKEN_INVALID",
        message: "Bearer token is invalid",
        requestId: "test-request-id",
      },
    });
    expect(request.jwtPayload).toBeUndefined();
  });

  it("should attach JWT payload to request when Bearer token is valid", async () => {
    const token = await createValidJwtToken();

    const request = createMockRequest({
      authorization: `Bearer ${token}`,
    });
    const { reply, status, send } = createMockReply();

    await jwtAuthMiddleware(request, reply);

    expect(status).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(request.jwtPayload).toBeDefined();
    expect(request.jwtPayload?.sub).toBe("user_123");
    expect(request.jwtPayload?.role).toBe("user");
  });
});