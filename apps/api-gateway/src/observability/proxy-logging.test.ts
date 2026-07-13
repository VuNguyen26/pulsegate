import { describe, expect, it } from "vitest";

import {
  buildAuthRejectionRecordingFailedLogPayload,
  buildQuotaRejectionRecordingFailedLogPayload,
  buildRateLimitRejectionRecordingFailedLogPayload,
  buildResponseCacheStoreFailedLogPayload,
  buildUsageRecordingFailedLogPayload,
} from "./logging.js";

describe("bounded proxy recorder failure logging", () => {
  it("uses fixed recorder failure events and codes", () => {
    expect(
      buildUsageRecordingFailedLogPayload(
        "request-1",
        "/api/products",
      ),
    ).toEqual({
      event: "api_usage_recording_failed",
      errorCode: "API_USAGE_RECORDING_FAILED",
      requestId: "request-1",
      route: "/api/products",
    });

    expect(
      buildQuotaRejectionRecordingFailedLogPayload(
        "request-1",
        "/api/products",
      ),
    ).toEqual({
      event: "quota_rejection_recording_failed",
      errorCode: "QUOTA_REJECTION_RECORDING_FAILED",
      requestId: "request-1",
      route: "/api/products",
    });

    expect(
      buildRateLimitRejectionRecordingFailedLogPayload(
        "request-1",
        "/api/products",
      ),
    ).toEqual({
      event: "rate_limit_rejection_recording_failed",
      errorCode: "RATE_LIMIT_REJECTION_RECORDING_FAILED",
      requestId: "request-1",
      route: "/api/products",
    });
  });

  it("keeps auth context bounded and excludes exceptions", () => {
    const payload =
      buildAuthRejectionRecordingFailedLogPayload(
        "request-1",
        "/api/products",
        "jwt",
      );

    expect(payload).toEqual({
      event: "auth_rejection_recording_failed",
      errorCode: "AUTH_REJECTION_RECORDING_FAILED",
      requestId: "request-1",
      route: "/api/products",
      authType: "jwt",
    });

    expect(JSON.stringify(payload)).not.toContain(
      "secret recorder exception",
    );
  });
});
describe("bounded response cache failure logging", () => {
  it("excludes cache keys and raw exceptions", () => {
    const payload =
      buildResponseCacheStoreFailedLogPayload(
        "request-1",
      );

    expect(payload).toEqual({
      event: "response_cache_store_failed",
      errorCode: "RESPONSE_CACHE_STORE_FAILED",
      requestId: "request-1",
    });

    const serialized = JSON.stringify(payload);

    expect(serialized).not.toContain("cacheKey");
    expect(serialized).not.toContain(
      "secret response cache exception",
    );
  });
});
