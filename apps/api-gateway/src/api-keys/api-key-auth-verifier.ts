import { env } from "../config/env.js";
import type { PrismaClient } from "../generated/prisma/index.js";
import type {
  ApiKeyAuthVerifier,
  ApiKeyVerificationResult,
} from "../middlewares/api-key-auth.middleware.js";
import { hashApiKey } from "./api-key-hashing.js";

export type PrismaApiKeyAuthVerifierOptions = {
  fallbackApiKeys?: string[];
  now?: () => Date;
  shouldSkipDatabaseLookup?: () => boolean;
};

function verifyFallbackApiKey(
  rawApiKey: string,
  fallbackApiKeys: readonly string[],
): ApiKeyVerificationResult {
  if (fallbackApiKeys.includes(rawApiKey)) {
    return {
      valid: true,
      source: "env",
    };
  }

  return {
    valid: false,
    source: "env",
    reason: "API_KEY_INVALID",
  };
}

export function createPrismaApiKeyAuthVerifier(
  prisma: PrismaClient,
  options: PrismaApiKeyAuthVerifierOptions = {},
): ApiKeyAuthVerifier {
  const fallbackApiKeys = options.fallbackApiKeys ?? env.API_KEYS;
  const now = options.now ?? (() => new Date());
  const shouldSkipDatabaseLookup =
    options.shouldSkipDatabaseLookup ??
    (() => !process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "");

  return async (rawApiKey: string): Promise<ApiKeyVerificationResult> => {
    const verifyFallback = () =>
      verifyFallbackApiKey(rawApiKey, fallbackApiKeys);

    if (shouldSkipDatabaseLookup()) {
      return verifyFallback();
    }

    let apiKeyRecord;

    try {
      apiKeyRecord = await prisma.apiKey.findUnique({
        where: {
          keyHash: hashApiKey(rawApiKey),
        },
        include: {
          consumer: true,
        },
      });
    } catch {
      return verifyFallback();
    }

    if (!apiKeyRecord) {
      return verifyFallback();
    }

    if (apiKeyRecord.status !== "ACTIVE") {
      return {
        valid: false,
        source: "database",
        reason: "API_KEY_REVOKED",
      };
    }

    if (apiKeyRecord.consumer.status !== "ACTIVE") {
      return {
        valid: false,
        source: "database",
        reason: "API_CONSUMER_DISABLED",
      };
    }

    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt <= now()) {
      return {
        valid: false,
        source: "database",
        reason: "API_KEY_EXPIRED",
      };
    }

    try {
      await prisma.apiKey.update({
        where: {
          id: apiKeyRecord.id,
        },
        data: {
          lastUsedAt: now(),
        },
      });
    } catch {
      // lastUsedAt is useful metadata, but auth should not fail only because
      // this best-effort update failed after the key was already verified.
    }

    return {
      valid: true,
      source: "database",
      apiKeyId: apiKeyRecord.id,
      consumerId: apiKeyRecord.consumerId,
    };
  };
}
