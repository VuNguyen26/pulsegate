import { describe, expect, it } from "vitest";

import {
  extractApiKeyPrefix,
  generateApiKey,
  hashApiKey,
  verifyApiKeyHash,
} from "./api-key-hashing.js";

describe("api key hashing", () => {
  it("should generate a raw API key with prefix, display prefix, and hash", () => {
    const generated = generateApiKey({
      keyPrefix: "pgk_test",
      randomBytesLength: 16,
    });

    expect(generated.rawKey).toMatch(/^pgk_test_/);
    expect(generated.keyPrefix).toBe(generated.rawKey.slice(0, 20));
    expect(generated.keyHash).toMatch(/^[a-f0-9]{64}$/);
    expect(generated.keyHash).not.toContain(generated.rawKey);
  });

  it("should generate different API keys each time", () => {
    const first = generateApiKey({ keyPrefix: "pgk_test" });
    const second = generateApiKey({ keyPrefix: "pgk_test" });

    expect(first.rawKey).not.toBe(second.rawKey);
    expect(first.keyHash).not.toBe(second.keyHash);
  });

  it("should hash the same API key deterministically", () => {
    const rawKey = "pgk_test_example";

    expect(hashApiKey(rawKey)).toBe(hashApiKey(rawKey));
  });

  it("should create different hashes for different API keys", () => {
    expect(hashApiKey("pgk_test_one")).not.toBe(hashApiKey("pgk_test_two"));
  });

  it("should verify a raw API key against its hash", () => {
    const rawKey = "pgk_test_example";
    const hash = hashApiKey(rawKey);

    expect(verifyApiKeyHash(rawKey, hash)).toBe(true);
  });

  it("should reject a raw API key that does not match the hash", () => {
    const hash = hashApiKey("pgk_test_original");

    expect(verifyApiKeyHash("pgk_test_wrong", hash)).toBe(false);
  });

  it("should return false when the expected hash is not a valid sha256 hex value", () => {
    expect(verifyApiKeyHash("pgk_test_example", "invalid-hash")).toBe(false);
  });

  it("should extract a stable display prefix from a raw API key", () => {
    expect(extractApiKeyPrefix("pgk_test_abcdefghijklmnopqrstuvwxyz")).toBe(
      "pgk_test_abcdefghijk",
    );
  });

  it("should reject empty raw API keys", () => {
    expect(() => hashApiKey("")).toThrow("rawKey must be a non-empty string");
  });

  it("should reject invalid random byte length", () => {
    expect(() => generateApiKey({ randomBytesLength: 0 })).toThrow(
      "randomBytesLength must be a positive integer",
    );
  });
});
