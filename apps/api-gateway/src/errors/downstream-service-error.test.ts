import { describe, expect, it } from "vitest";

import {
  DownstreamServiceError,
  isDownstreamServiceError,
} from "./downstream-service-error.js";

describe("DownstreamServiceError", () => {
  it("should create a downstream service error with required properties", () => {
    const error = new DownstreamServiceError({
      code: "DOWNSTREAM_SERVICE_UNAVAILABLE",
      message: "Product Service is currently unavailable",
      service: "product-service",
      statusCode: 503,
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DownstreamServiceError);
    expect(error.name).toBe("DownstreamServiceError");
    expect(error.message).toBe("Product Service is currently unavailable");
    expect(error.code).toBe("DOWNSTREAM_SERVICE_UNAVAILABLE");
    expect(error.service).toBe("product-service");
    expect(error.statusCode).toBe(503);
    expect(error.originalError).toBeUndefined();
  });

  it("should store the original error when provided", () => {
    const originalError = new Error("fetch failed");

    const error = new DownstreamServiceError({
      code: "DOWNSTREAM_TIMEOUT",
      message: "Product Service did not respond in time",
      service: "product-service",
      statusCode: 504,
      originalError,
    });

    expect(error.originalError).toBe(originalError);
  });

  it("should identify DownstreamServiceError correctly", () => {
    const error = new DownstreamServiceError({
      code: "DOWNSTREAM_HTTP_ERROR",
      message: "Product Service returned an error",
      service: "product-service",
      statusCode: 502,
    });

    expect(isDownstreamServiceError(error)).toBe(true);
  });

  it("should return false for normal Error", () => {
    const error = new Error("normal error");

    expect(isDownstreamServiceError(error)).toBe(false);
  });

  it("should return false for non-error values", () => {
    expect(isDownstreamServiceError(null)).toBe(false);
    expect(isDownstreamServiceError(undefined)).toBe(false);
    expect(isDownstreamServiceError("error")).toBe(false);
    expect(isDownstreamServiceError({ message: "error" })).toBe(false);
  });
});