import { describe, expect, it } from "vitest";
import type { IncomingMessage } from "node:http";

import { generateRequestId } from "./request-id.middleware.js";

function createMockRequest(headers: IncomingMessage["headers"]): IncomingMessage {
  return {
    headers,
  } as IncomingMessage;
}

describe("generateRequestId", () => {
  it("should reuse x-request-id when the header is a non-empty string", () => {
    const request = createMockRequest({
      "x-request-id": "test-request-id",
    });

    const requestId = generateRequestId(request);

    expect(requestId).toBe("test-request-id");
  });

  it("should use the first x-request-id when the header is an array", () => {
    const request = createMockRequest({
      "x-request-id": ["first-request-id", "second-request-id"],
    });

    const requestId = generateRequestId(request);

    expect(requestId).toBe("first-request-id");
  });

  it("should generate a new request id when x-request-id is missing", () => {
    const request = createMockRequest({});

    const requestId = generateRequestId(request);

    expect(typeof requestId).toBe("string");
    expect(requestId.length).toBeGreaterThan(0);
  });

  it("should generate a new request id when x-request-id is an empty string", () => {
    const request = createMockRequest({
      "x-request-id": "",
    });

    const requestId = generateRequestId(request);

    expect(typeof requestId).toBe("string");
    expect(requestId.length).toBeGreaterThan(0);
    expect(requestId).not.toBe("");
  });
});