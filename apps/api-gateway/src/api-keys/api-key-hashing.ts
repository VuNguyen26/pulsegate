import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export type GeneratedApiKey = {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
};

export type GenerateApiKeyOptions = {
  keyPrefix?: string;
  randomBytesLength?: number;
};

const DEFAULT_KEY_PREFIX = "pgk_live";
const DEFAULT_RANDOM_BYTES_LENGTH = 32;
const DISPLAY_PREFIX_LENGTH = 20;

function assertNonEmptyString(value: string, fieldName: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }
}

function normalizeKeyPrefix(keyPrefix: string): string {
  assertNonEmptyString(keyPrefix, "keyPrefix");

  return keyPrefix.trim().replace(/[^a-zA-Z0-9_]/g, "_");
}

export function extractApiKeyPrefix(rawKey: string): string {
  assertNonEmptyString(rawKey, "rawKey");

  return rawKey.slice(0, DISPLAY_PREFIX_LENGTH);
}

export function hashApiKey(rawKey: string): string {
  assertNonEmptyString(rawKey, "rawKey");

  return createHash("sha256").update(rawKey).digest("hex");
}

export function verifyApiKeyHash(rawKey: string, expectedHash: string): boolean {
  assertNonEmptyString(rawKey, "rawKey");
  assertNonEmptyString(expectedHash, "expectedHash");

  const actualHash = hashApiKey(rawKey);

  const actualHashBuffer = Buffer.from(actualHash, "hex");
  const expectedHashBuffer = Buffer.from(expectedHash, "hex");

  if (actualHashBuffer.length !== expectedHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualHashBuffer, expectedHashBuffer);
}

export function generateApiKey(
  options: GenerateApiKeyOptions = {},
): GeneratedApiKey {
  const keyPrefix = normalizeKeyPrefix(options.keyPrefix ?? DEFAULT_KEY_PREFIX);
  const randomBytesLength =
    options.randomBytesLength ?? DEFAULT_RANDOM_BYTES_LENGTH;

  if (!Number.isInteger(randomBytesLength) || randomBytesLength <= 0) {
    throw new Error("randomBytesLength must be a positive integer");
  }

  const secret = randomBytes(randomBytesLength).toString("base64url");
  const rawKey = `${keyPrefix}_${secret}`;

  return {
    rawKey,
    keyPrefix: extractApiKeyPrefix(rawKey),
    keyHash: hashApiKey(rawKey),
  };
}
