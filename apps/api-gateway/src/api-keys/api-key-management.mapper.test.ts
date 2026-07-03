import { describe, expect, it } from "vitest";

import {
  mapApiKeyCreateRequestToCreateRequestData,
  mapApiKeyReadModelToResponse,
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

  it("should map API key read model to response without exposing keyHash", () => {
    const response = mapApiKeyReadModelToResponse(activeApiKey);

    expect(response).toEqual({
      id: "key_1",
      consumerId: "consumer_1",
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
