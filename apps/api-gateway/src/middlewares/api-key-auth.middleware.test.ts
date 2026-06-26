import type {
  FastifyReply,
  FastifyRequest,
  HookHandlerDoneFunction,
} from "fastify";
import { describe, expect, it, vi } from "vitest";

import { apiKeyAuthMiddleware } from "./api-key-auth.middleware.js";

function createMockRequest(
  headers: FastifyRequest["headers"]
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
    expect(status).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
});