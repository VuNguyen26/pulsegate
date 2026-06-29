import { describe, expect, it, vi } from "vitest";

import {
  executeWithRetry,
  isRetryableHttpMethod,
  shouldRetryStatus,
} from "./retry.policy.js";

describe("isRetryableHttpMethod", () => {
  it("should allow retry only for GET requests", () => {
    expect(isRetryableHttpMethod("GET")).toBe(true);
    expect(isRetryableHttpMethod("get")).toBe(true);
    expect(isRetryableHttpMethod("POST")).toBe(false);
    expect(isRetryableHttpMethod("PUT")).toBe(false);
    expect(isRetryableHttpMethod("PATCH")).toBe(false);
    expect(isRetryableHttpMethod("DELETE")).toBe(false);
  });
});

describe("shouldRetryStatus", () => {
  it("should check whether status code is configured as retryable", () => {
    const policy = {
      enabled: true,
      attempts: 2,
      retryOnStatuses: [502, 503, 504],
    };

    expect(shouldRetryStatus(policy, 502)).toBe(true);
    expect(shouldRetryStatus(policy, 503)).toBe(true);
    expect(shouldRetryStatus(policy, 504)).toBe(true);
    expect(shouldRetryStatus(policy, 500)).toBe(false);
  });
});

describe("executeWithRetry", () => {
  it("should execute once when retry policy is disabled", async () => {
    const operation = vi.fn(async () => "ok");

    const result = await executeWithRetry({
      method: "GET",
      policy: {
        enabled: false,
        attempts: 2,
        retryOnStatuses: [502, 503, 504],
      },
      operation,
    });

    expect(result).toBe("ok");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("should retry GET result when shouldRetryResult returns true", async () => {
    const operation = vi
      .fn<() => Promise<{ statusCode: number }>>()
      .mockResolvedValueOnce({ statusCode: 503 })
      .mockResolvedValueOnce({ statusCode: 200 });

    const result = await executeWithRetry({
      method: "GET",
      policy: {
        enabled: true,
        attempts: 2,
        retryOnStatuses: [502, 503, 504],
      },
      operation,
      shouldRetryResult: (response) => response.statusCode === 503,
    });

    expect(result).toEqual({ statusCode: 200 });
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("should not retry non-GET requests", async () => {
    const operation = vi.fn(async () => ({
      statusCode: 503,
    }));

    const result = await executeWithRetry({
      method: "POST",
      policy: {
        enabled: true,
        attempts: 2,
        retryOnStatuses: [502, 503, 504],
      },
      operation,
      shouldRetryResult: (response) => response.statusCode === 503,
    });

    expect(result).toEqual({ statusCode: 503 });
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("should stop retrying after configured attempts", async () => {
    const operation = vi.fn(async () => ({
      statusCode: 503,
    }));

    const result = await executeWithRetry({
      method: "GET",
      policy: {
        enabled: true,
        attempts: 2,
        retryOnStatuses: [502, 503, 504],
      },
      operation,
      shouldRetryResult: (response) => response.statusCode === 503,
    });

    expect(result).toEqual({ statusCode: 503 });
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it("should retry errors when shouldRetryError returns true", async () => {
    const retryableError = new Error("temporary upstream failure");

    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(retryableError)
      .mockResolvedValueOnce("ok");

    const result = await executeWithRetry({
      method: "GET",
      policy: {
        enabled: true,
        attempts: 2,
        retryOnStatuses: [502, 503, 504],
      },
      operation,
      shouldRetryError: (error) => error === retryableError,
    });

    expect(result).toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("should throw the final error after retry is exhausted", async () => {
    const retryableError = new Error("temporary upstream failure");

    const operation = vi.fn<() => Promise<string>>().mockRejectedValue(
      retryableError,
    );

    await expect(
      executeWithRetry({
        method: "GET",
        policy: {
          enabled: true,
          attempts: 2,
          retryOnStatuses: [502, 503, 504],
        },
        operation,
        shouldRetryError: (error) => error === retryableError,
      }),
    ).rejects.toThrow("temporary upstream failure");

    expect(operation).toHaveBeenCalledTimes(3);
  });
});