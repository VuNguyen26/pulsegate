import type { PrismaClient } from "../generated/prisma/index.js";
import { describe, expect, it, vi } from "vitest";

import { createPrismaApiKeyAuthVerifier } from "./api-key-auth-verifier.js";
import { hashApiKey } from "./api-key-hashing.js";

const now = new Date("2026-07-03T00:00:00.000Z");
const future = new Date("2026-08-03T00:00:00.000Z");
const past = new Date("2026-06-03T00:00:00.000Z");

function createMockPrisma(options: {
  apiKeyRecord?: unknown;
  findUniqueError?: Error;
}) {
  const findUnique = vi.fn(async () => {
    if (options.findUniqueError) {
      throw options.findUniqueError;
    }

    return options.apiKeyRecord ?? null;
  });

  const update = vi.fn(async () => {
    return options.apiKeyRecord;
  });

  return {
    prisma: {
      apiKey: {
        findUnique,
        update,
      },
    } as unknown as PrismaClient,
    findUnique,
    update,
  };
}

function createActiveApiKeyRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "key_1",
    consumerId: "consumer_1",
    keyHash: hashApiKey("pgk_live_valid"),
    status: "ACTIVE",
    expiresAt: future,
    consumer: {
      id: "consumer_1",
      status: "ACTIVE",
    },
    ...overrides,
  };
}

describe("api key auth verifier", () => {
  it("should verify an active DB-backed API key", async () => {
    const { prisma, findUnique, update } = createMockPrisma({
      apiKeyRecord: createActiveApiKeyRecord(),
    });

    const verifier = createPrismaApiKeyAuthVerifier(prisma, {
      fallbackApiKeys: [],
      now: () => now,
      shouldSkipDatabaseLookup: () => false,
    });

    await expect(verifier("pgk_live_valid")).resolves.toEqual({
      valid: true,
      source: "database",
      apiKeyId: "key_1",
      consumerId: "consumer_1",
    });

    expect(findUnique).toHaveBeenCalledWith({
      where: {
        keyHash: hashApiKey("pgk_live_valid"),
      },
      include: {
        consumer: true,
      },
    });

    expect(update).toHaveBeenCalledWith({
      where: {
        id: "key_1",
      },
      data: {
        lastUsedAt: now,
      },
    });
  });

  it("should reject a revoked DB-backed API key", async () => {
    const { prisma } = createMockPrisma({
      apiKeyRecord: createActiveApiKeyRecord({
        status: "REVOKED",
      }),
    });

    const verifier = createPrismaApiKeyAuthVerifier(prisma, {
      fallbackApiKeys: ["pgk_live_valid"],
      shouldSkipDatabaseLookup: () => false,
    });

    await expect(verifier("pgk_live_valid")).resolves.toEqual({
      valid: false,
      source: "database",
      reason: "API_KEY_REVOKED",
    });
  });

  it("should reject a key when its consumer is disabled", async () => {
    const { prisma } = createMockPrisma({
      apiKeyRecord: createActiveApiKeyRecord({
        consumer: {
          id: "consumer_1",
          status: "DISABLED",
        },
      }),
    });

    const verifier = createPrismaApiKeyAuthVerifier(prisma, {
      fallbackApiKeys: ["pgk_live_valid"],
      shouldSkipDatabaseLookup: () => false,
    });

    await expect(verifier("pgk_live_valid")).resolves.toEqual({
      valid: false,
      source: "database",
      reason: "API_CONSUMER_DISABLED",
    });
  });

  it("should reject an expired DB-backed API key", async () => {
    const { prisma } = createMockPrisma({
      apiKeyRecord: createActiveApiKeyRecord({
        expiresAt: past,
      }),
    });

    const verifier = createPrismaApiKeyAuthVerifier(prisma, {
      fallbackApiKeys: ["pgk_live_valid"],
      now: () => now,
      shouldSkipDatabaseLookup: () => false,
    });

    await expect(verifier("pgk_live_valid")).resolves.toEqual({
      valid: false,
      source: "database",
      reason: "API_KEY_EXPIRED",
    });
  });

  it("should fall back to env API keys when DB key is not found", async () => {
    const { prisma } = createMockPrisma({});

    const verifier = createPrismaApiKeyAuthVerifier(prisma, {
      fallbackApiKeys: ["dev-api-key"],
      shouldSkipDatabaseLookup: () => false,
    });

    await expect(verifier("dev-api-key")).resolves.toEqual({
      valid: true,
      source: "env",
    });
  });

  it("should return invalid when DB key is not found and fallback API key does not match", async () => {
    const { prisma } = createMockPrisma({});

    const verifier = createPrismaApiKeyAuthVerifier(prisma, {
      fallbackApiKeys: ["dev-api-key"],
      shouldSkipDatabaseLookup: () => false,
    });

    await expect(verifier("wrong-key")).resolves.toEqual({
      valid: false,
      source: "env",
      reason: "API_KEY_INVALID",
    });
  });

  it("should fall back to env API keys when DB lookup fails", async () => {
    const { prisma } = createMockPrisma({
      findUniqueError: new Error("database unavailable"),
    });

    const verifier = createPrismaApiKeyAuthVerifier(prisma, {
      fallbackApiKeys: ["dev-api-key"],
      shouldSkipDatabaseLookup: () => false,
    });

    await expect(verifier("dev-api-key")).resolves.toEqual({
      valid: true,
      source: "env",
    });
  });

  it("should skip DB lookup when DATABASE_URL is not configured", async () => {
    const { prisma, findUnique } = createMockPrisma({
      apiKeyRecord: createActiveApiKeyRecord(),
    });

    const verifier = createPrismaApiKeyAuthVerifier(prisma, {
      fallbackApiKeys: ["dev-api-key"],
      shouldSkipDatabaseLookup: () => true,
    });

    await expect(verifier("dev-api-key")).resolves.toEqual({
      valid: true,
      source: "env",
    });

    expect(findUnique).not.toHaveBeenCalled();
  });
});
