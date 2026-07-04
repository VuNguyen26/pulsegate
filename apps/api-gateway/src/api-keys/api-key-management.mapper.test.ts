import { describe, expect, it } from "vitest";

import {
  mapApiKeyCreateRequestToCreateRequestData,
  mapApiKeyReadModelToResponse,
  mapApiKeyUsagePlanAssignmentRequestToData,
  mapIssuedApiKeyToResponse,
} from "./api-key-management.mapper.js";
import type { ApiKeyReadModel } from "./api-key-management.types.js";

const createdAt = new Date("2026-07-03T00:00:00.000Z");
const updatedAt = new Date("2026-07-03T01:00:00.000Z");
const expiresAt = new Date("2026-08-01T00:00:00.000Z");
const lastUsedAt = new Date("2026-07-03T02:00:00.000Z");
const revokedAt = new Date("2026-07-03T03:00:00.000Z");

const activeApiKey: ApiKeyReadModel = {
  id: "key_1",
  consumerId: "consumer_1",
  usagePlanId: null,
  name: "Production Key",
  keyPrefix: "pgk_live_abcdefghijk",
  keyHash: "a".repeat(64),
  status: "ACTIVE",
  expiresAt,
  lastUsedAt,
  createdAt,
  updatedAt,
  createdBy: "admin",
  revokedAt: null,
  revokedBy: null,
};

describe("api key management mapper", () => {
  it("should map create request without expiration", () => {
    expect(
      mapApiKeyCreateRequestToCreateRequestData({
        name: "  Production Key  ",
      }),
    ).toEqual({
      name: "Production Key",
      expiresAt: null,
    });
  });

  it("should map create request with ISO expiration", () => {
    expect(
      mapApiKeyCreateRequestToCreateRequestData({
        name: "Production Key",
        expiresAt: "2026-08-01T00:00:00.000Z",
      }),
    ).toEqual({
      name: "Production Key",
      expiresAt,
    });
  });

  it("should map null expiration to null", () => {
    expect(
      mapApiKeyCreateRequestToCreateRequestData({
        name: "Production Key",
        expiresAt: null,
      }),
    ).toEqual({
      name: "Production Key",
      expiresAt: null,
    });
  });

  it("should reject create request when body is not an object", () => {
    expect(() => mapApiKeyCreateRequestToCreateRequestData(null)).toThrow(
      "request body must be an object",
    );
  });

  it("should reject create request when name is missing", () => {
    expect(() => mapApiKeyCreateRequestToCreateRequestData({})).toThrow(
      "name must be a non-empty string",
    );
  });

  it("should reject create request when expiration is invalid", () => {
    expect(() =>
      mapApiKeyCreateRequestToCreateRequestData({
        name: "Production Key",
        expiresAt: "not-a-date",
      }),
    ).toThrow("expiresAt must be a valid ISO datetime string");
  });

  it("should map usage plan assignment request", () => {
    expect(
      mapApiKeyUsagePlanAssignmentRequestToData({
        usagePlanId: "  plan_starter  ",
      }),
    ).toEqual({
      usagePlanId: "plan_starter",
    });
  });

  it("should map usage plan unassignment request", () => {
    expect(
      mapApiKeyUsagePlanAssignmentRequestToData({
        usagePlanId: null,
      }),
    ).toEqual({
      usagePlanId: null,
    });
  });

  it("should reject usage plan assignment when usagePlanId is missing", () => {
    expect(() => mapApiKeyUsagePlanAssignmentRequestToData({})).toThrow(
      "usagePlanId must be a non-empty string or null",
    );
  });

  it("should reject usage plan assignment when usagePlanId is empty", () => {
    expect(() =>
      mapApiKeyUsagePlanAssignmentRequestToData({
        usagePlanId: "   ",
      }),
    ).toThrow("usagePlanId must be a non-empty string or null");
  });

  it("should reject usage plan assignment when usagePlanId is invalid", () => {
    expect(() =>
      mapApiKeyUsagePlanAssignmentRequestToData({
        usagePlanId: 123,
      }),
    ).toThrow("usagePlanId must be a non-empty string or null");
  });

  it("should map API key read model to response without exposing keyHash", () => {
    const response = mapApiKeyReadModelToResponse(activeApiKey);

    expect(response).toEqual({
      id: "key_1",
      consumerId: "consumer_1",
      usagePlanId: null,
      name: "Production Key",
      keyPrefix: "pgk_live_abcdefghijk",
      status: "ACTIVE",
      expiresAt: "2026-08-01T00:00:00.000Z",
      lastUsedAt: "2026-07-03T02:00:00.000Z",
      createdAt: "2026-07-03T00:00:00.000Z",
      updatedAt: "2026-07-03T01:00:00.000Z",
      createdBy: "admin",
      revokedAt: null,
      revokedBy: null,
    });

    expect(response).not.toHaveProperty("keyHash");
  });

  it("should include usagePlanId in API key response when assigned", () => {
    expect(
      mapApiKeyReadModelToResponse({
        ...activeApiKey,
        usagePlanId: "plan_starter",
      }),
    ).toMatchObject({
      usagePlanId: "plan_starter",
    });
  });

  it("should map nullable fields to null", () => {
    expect(
      mapApiKeyReadModelToResponse({
        ...activeApiKey,
        expiresAt: null,
        lastUsedAt: null,
        createdBy: undefined,
        revokedAt: undefined,
        revokedBy: undefined,
      }),
    ).toMatchObject({
      expiresAt: null,
      lastUsedAt: null,
      createdBy: null,
      revokedAt: null,
      revokedBy: null,
    });
  });

  it("should map revoked API key read model to response", () => {
    expect(
      mapApiKeyReadModelToResponse({
        ...activeApiKey,
        status: "REVOKED",
        revokedAt,
        revokedBy: "admin",
      }),
    ).toMatchObject({
      status: "REVOKED",
      revokedAt: "2026-07-03T03:00:00.000Z",
      revokedBy: "admin",
    });
  });

  it("should include rawKey only in issued API key response", () => {
    expect(mapIssuedApiKeyToResponse(activeApiKey, "pgk_live_raw_secret")).toEqual({
      ...mapApiKeyReadModelToResponse(activeApiKey),
      rawKey: "pgk_live_raw_secret",
    });
  });
});