import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildProductAccessLogPayload,
  calculateProductDurationMs,
  getProductAccessLogRoute,
} from "./access-log.middleware.js";

function createRequest(
  route: string | undefined,
): FastifyRequest {
  return {
    id: "request-1",
    method: "GET",
    routeOptions: {
      url: route,
    },
    raw: {
      url:
        "/secret-path?credential=value",
    },
    productTracingState: {
      span: {
        spanContext: () => ({
          traceId:
            "a".repeat(32),
          spanId:
            "b".repeat(16),
          traceFlags: 1,
        }),
      },
      context: {},
      method: "GET",
      route:
        route ??
        "__unmatched__",
      ended: true,
    },
  } as unknown as FastifyRequest;
}

describe(
  "bounded Product access logging",
  () => {
    it("uses the configured route template", () => {
      expect(
        getProductAccessLogRoute(
          createRequest("/products"),
        ),
      ).toBe("/products");
    });

    it("does not use a raw unmatched URL", () => {
      expect(
        getProductAccessLogRoute(
          createRequest(undefined),
        ),
      ).toBe("__unmatched__");
    });

    it("includes bounded correlation fields", () => {
      const payload =
        buildProductAccessLogPayload(
          createRequest("/products"),
          {
            statusCode: 200,
          } as FastifyReply,
          12.34,
        );

      expect(payload).toEqual({
        event:
          "http_request_completed",
        requestId: "request-1",
        traceId:
          "a".repeat(32),
        spanId:
          "b".repeat(16),
        method: "GET",
        route: "/products",
        statusCode: 200,
        durationMs: 12.34,
      });

      expect(
        JSON.stringify(payload),
      ).not.toContain(
        "credential=value",
      );
    });

    it("calculates duration in milliseconds", () => {
      expect(
        calculateProductDurationMs(
          1_000_000n,
          3_345_000n,
        ),
      ).toBe(2.35);
    });
  },
);