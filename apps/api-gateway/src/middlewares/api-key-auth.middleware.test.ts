import type {
  FastifyReply,
  FastifyRequest,
  HookHandlerDoneFunction,
} from "fastify";
import { describe, expect, it, vi } from "vitest";

import {
  apiKeyAuthMiddleware,
  createApiKeyAuthMiddleware,
} from "./api-key-auth.middleware.js";

function createMockRequest(
  headers: FastifyRequest["headers"],
): FastifyRequest {
  return {
    headers,
    id: "test-request-id",
  } as FastifyRequest;
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

function createMockDone(): HookHandlerDoneFunction {
  return vi.fn() as unknown as HookHandlerDoneFunction;
}

describe("apiKeyAuthMiddleware", () => {
  it("should return 401 when API key is missing", () => {
    const request = createMockRequest({});
    const { reply, status, send } = createMockReply();
    const done = createMockDone();

    apiKeyAuthMiddleware(request, reply, done);

    expect(status).toHaveBeenCalledWith(401);
    expect(send).toHaveBeenCalledWith({
      error: {
        code: "API_KEY_MISSING",
        message: "API key is required",
        requestId: "test-request-id",
      },
    });
    expect(done).not.toHaveBeenCalled();
  });

  it("should return 403 when API key is invalid", () => {
    const request = createMockRequest({
      "x-api-key": "wrong-key",
    });
    const { reply, status, send } = createMockReply();
    const done = createMockDone();

    apiKeyAuthMiddleware(request, reply, done);

    expect(status).toHaveBeenCalledWith(403);
    expect(send).toHaveBeenCalledWith({
      error: {
        code: "API_KEY_INVALID",
        message: "API key is invalid",
        requestId: "test-request-id",
      },
    });
    expect(done).not.toHaveBeenCalled();
  });

  it("should call done when API key is valid", () => {
    const request = createMockRequest({
      "x-api-key": "dev-api-key",
    });
    const { reply, status, send } = createMockReply();
    const done = createMockDone();

    apiKeyAuthMiddleware(request, reply, done);

    expect(done).toHaveBeenCalledTimes(1);
    expect(request.apiKey).toBe("dev-api-key");
    expect(request.apiKeyAuthSource).toBe("env");
    expect(status).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("should call done when API key header is an array and first value is valid", () => {
    const request = createMockRequest({
      "x-api-key": ["dev-api-key", "another-key"],
    });
    const { reply, status, send } = createMockReply();
    const done = createMockDone();

    apiKeyAuthMiddleware(request, reply, done);

    expect(done).toHaveBeenCalledTimes(1);
    expect(request.apiKey).toBe("dev-api-key");
    expect(status).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
});

describe("createApiKeyAuthMiddleware", () => {
  it("should verify API key using an injected verifier", async () => {
    const request = createMockRequest({
      "x-api-key": "pgk_live_valid",
    });
    const { reply, status, send } = createMockReply();

    const middleware = createApiKeyAuthMiddleware({
      verifier: async () => ({
        valid: true,
        source: "database",
        apiKeyId: "key_1",
        consumerId: "consumer_1",
      }),
    });

    await middleware(request, reply);

    expect(request.apiKey).toBe("pgk_live_valid");
    expect(request.apiKeyId).toBe("key_1");
    expect(request.apiConsumerId).toBe("consumer_1");
    expect(request.apiKeyAuthSource).toBe("database");
    expect(status).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("should reject API key when injected verifier returns invalid", async () => {
    const request = createMockRequest({
      "x-api-key": "pgk_live_invalid",
    });
    const { reply, status, send } = createMockReply();

    const middleware = createApiKeyAuthMiddleware({
      verifier: async () => ({
        valid: false,
        source: "database",
        reason: "API_KEY_REVOKED",
      }),
    });

    await middleware(request, reply);

    expect(status).toHaveBeenCalledWith(403);
    expect(send).toHaveBeenCalledWith({
      error: {
        code: "API_KEY_INVALID",
        message: "API key is invalid",
        requestId: "test-request-id",
      },
    });
  });

  it("should support a custom API key header name", async () => {
    const request = createMockRequest({
      "x-custom-api-key": "pgk_live_valid",
    });
    const { reply, status, send } = createMockReply();

    const middleware = createApiKeyAuthMiddleware({
      headerName: "x-custom-api-key",
      verifier: async () => ({
        valid: true,
        source: "database",
      }),
    });

    await middleware(request, reply);

    expect(request.apiKey).toBe("pgk_live_valid");
    expect(request.apiKeyAuthSource).toBe("database");
    expect(status).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
});
