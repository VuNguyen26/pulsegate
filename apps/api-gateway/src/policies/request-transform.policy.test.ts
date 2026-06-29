import { describe, expect, it } from "vitest";

import { applyRequestHeaderTransform } from "./request-transform.policy.js";

describe("applyRequestHeaderTransform", () => {
  it("should return a copy of headers when policy is disabled", () => {
    const headers = {
      "x-request-id": "request-123",
    };

    const transformedHeaders = applyRequestHeaderTransform(headers, {
      enabled: false,
    });

    expect(transformedHeaders).toEqual({
      "x-request-id": "request-123",
    });

    expect(transformedHeaders).not.toBe(headers);
  });

  it("should add configured request headers", () => {
    const transformedHeaders = applyRequestHeaderTransform(
      {
        "x-request-id": "request-123",
      },
      {
        enabled: true,
        addHeaders: {
          "x-gateway-name": "pulsegate",
        },
      },
    );

    expect(transformedHeaders).toEqual({
      "x-request-id": "request-123",
      "x-gateway-name": "pulsegate",
    });
  });

  it("should remove configured request headers case-insensitively", () => {
    const transformedHeaders = applyRequestHeaderTransform(
      {
        "x-request-id": "request-123",
        "X-Internal-Debug": "true",
      },
      {
        enabled: true,
        removeHeaders: ["x-internal-debug"],
      },
    );

    expect(transformedHeaders).toEqual({
      "x-request-id": "request-123",
    });
  });

  it("should allow added headers to win after removal", () => {
    const transformedHeaders = applyRequestHeaderTransform(
      {
        "x-request-id": "request-123",
        "x-gateway-name": "old-value",
      },
      {
        enabled: true,
        removeHeaders: ["x-gateway-name"],
        addHeaders: {
          "x-gateway-name": "pulsegate",
        },
      },
    );

    expect(transformedHeaders).toEqual({
      "x-request-id": "request-123",
      "x-gateway-name": "pulsegate",
    });
  });

  it("should not mutate the original headers object", () => {
    const headers = {
      "x-request-id": "request-123",
      "x-internal-debug": "true",
    };

    const transformedHeaders = applyRequestHeaderTransform(headers, {
      enabled: true,
      removeHeaders: ["x-internal-debug"],
      addHeaders: {
        "x-gateway-name": "pulsegate",
      },
    });

    expect(headers).toEqual({
      "x-request-id": "request-123",
      "x-internal-debug": "true",
    });

    expect(transformedHeaders).toEqual({
      "x-request-id": "request-123",
      "x-gateway-name": "pulsegate",
    });
  });
});