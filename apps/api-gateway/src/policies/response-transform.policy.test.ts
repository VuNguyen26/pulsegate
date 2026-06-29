import { describe, expect, it } from "vitest";

import { applyResponseHeaderTransform } from "./response-transform.policy.js";

describe("applyResponseHeaderTransform", () => {
  it("should return a copy of headers when policy is disabled", () => {
    const headers = {
      "content-type": "application/json",
    };

    const transformedHeaders = applyResponseHeaderTransform(headers, {
      enabled: false,
    });

    expect(transformedHeaders).toEqual({
      "content-type": "application/json",
    });

    expect(transformedHeaders).not.toBe(headers);
  });

  it("should add configured response headers", () => {
    const transformedHeaders = applyResponseHeaderTransform(
      {
        "content-type": "application/json",
      },
      {
        enabled: true,
        addHeaders: {
          "x-served-by": "pulsegate",
        },
      },
    );

    expect(transformedHeaders).toEqual({
      "content-type": "application/json",
      "x-served-by": "pulsegate",
    });
  });

  it("should remove configured response headers case-insensitively", () => {
    const transformedHeaders = applyResponseHeaderTransform(
      {
        "content-type": "application/json",
        "X-Internal-Upstream": "true",
      },
      {
        enabled: true,
        removeHeaders: ["x-internal-upstream"],
      },
    );

    expect(transformedHeaders).toEqual({
      "content-type": "application/json",
    });
  });

  it("should allow added headers to win after removal", () => {
    const transformedHeaders = applyResponseHeaderTransform(
      {
        "content-type": "application/json",
        "x-served-by": "old-value",
      },
      {
        enabled: true,
        removeHeaders: ["x-served-by"],
        addHeaders: {
          "x-served-by": "pulsegate",
        },
      },
    );

    expect(transformedHeaders).toEqual({
      "content-type": "application/json",
      "x-served-by": "pulsegate",
    });
  });

  it("should not mutate the original headers object", () => {
    const headers = {
      "content-type": "application/json",
      "x-internal-upstream": "true",
    };

    const transformedHeaders = applyResponseHeaderTransform(headers, {
      enabled: true,
      removeHeaders: ["x-internal-upstream"],
      addHeaders: {
        "x-served-by": "pulsegate",
      },
    });

    expect(headers).toEqual({
      "content-type": "application/json",
      "x-internal-upstream": "true",
    });

    expect(transformedHeaders).toEqual({
      "content-type": "application/json",
      "x-served-by": "pulsegate",
    });
  });
});