import { afterEach, describe, expect, it, vi } from "vitest";

import { readCsvEnv, readNumberEnv, readStringEnv } from "./env.js";

const TEST_NUMBER_ENV = "TEST_NUMBER_ENV";
const TEST_CSV_ENV = "TEST_CSV_ENV";
const TEST_STRING_ENV = "TEST_STRING_ENV";

afterEach(() => {
  delete process.env[TEST_NUMBER_ENV];
  delete process.env[TEST_CSV_ENV];
  delete process.env[TEST_STRING_ENV];
  delete process.env.ADMIN_API_KEY_HEADER;
  delete process.env.ADMIN_API_KEY;

  vi.resetModules();
});

describe("readNumberEnv", () => {
  it("should return fallback when env value is missing", () => {
    const value = readNumberEnv(TEST_NUMBER_ENV, 3000);

    expect(value).toBe(3000);
  });

  it("should return parsed number when env value is valid", () => {
    process.env[TEST_NUMBER_ENV] = "5000";

    const value = readNumberEnv(TEST_NUMBER_ENV, 3000);

    expect(value).toBe(5000);
  });

  it("should return fallback when env value is not a number", () => {
    process.env[TEST_NUMBER_ENV] = "abc";

    const value = readNumberEnv(TEST_NUMBER_ENV, 3000);

    expect(value).toBe(3000);
  });

  it("should return fallback when env value is zero", () => {
    process.env[TEST_NUMBER_ENV] = "0";

    const value = readNumberEnv(TEST_NUMBER_ENV, 3000);

    expect(value).toBe(3000);
  });

  it("should return fallback when env value is negative", () => {
    process.env[TEST_NUMBER_ENV] = "-100";

    const value = readNumberEnv(TEST_NUMBER_ENV, 3000);

    expect(value).toBe(3000);
  });
});

describe("readCsvEnv", () => {
  it("should return fallback when env value is missing", () => {
    const value = readCsvEnv(TEST_CSV_ENV, ["dev-api-key"]);

    expect(value).toEqual(["dev-api-key"]);
  });

  it("should parse comma-separated values", () => {
    process.env[TEST_CSV_ENV] = "key-1,key-2,key-3";

    const value = readCsvEnv(TEST_CSV_ENV, ["dev-api-key"]);

    expect(value).toEqual(["key-1", "key-2", "key-3"]);
  });

  it("should trim spaces and remove empty values", () => {
    process.env[TEST_CSV_ENV] = " key-1, , key-2 ,, key-3 ";

    const value = readCsvEnv(TEST_CSV_ENV, ["dev-api-key"]);

    expect(value).toEqual(["key-1", "key-2", "key-3"]);
  });

  it("should return fallback when parsed values are empty", () => {
    process.env[TEST_CSV_ENV] = ",,,   ,";

    const value = readCsvEnv(TEST_CSV_ENV, ["dev-api-key"]);

    expect(value).toEqual(["dev-api-key"]);
  });
});

describe("readStringEnv", () => {
  it("should return fallback when env value is missing", () => {
    const value = readStringEnv(TEST_STRING_ENV, "fallback-value");

    expect(value).toBe("fallback-value");
  });

  it("should return env value when env value is valid", () => {
    process.env[TEST_STRING_ENV] = "custom-value";

    const value = readStringEnv(TEST_STRING_ENV, "fallback-value");

    expect(value).toBe("custom-value");
  });

  it("should trim env value", () => {
    process.env[TEST_STRING_ENV] = "  custom-value  ";

    const value = readStringEnv(TEST_STRING_ENV, "fallback-value");

    expect(value).toBe("custom-value");
  });

  it("should return fallback when env value is an empty string", () => {
    process.env[TEST_STRING_ENV] = "";

    const value = readStringEnv(TEST_STRING_ENV, "fallback-value");

    expect(value).toBe("fallback-value");
  });

  it("should return fallback when env value only contains spaces", () => {
    process.env[TEST_STRING_ENV] = "     ";

    const value = readStringEnv(TEST_STRING_ENV, "fallback-value");

    expect(value).toBe("fallback-value");
  });
});

describe("env", () => {
  it("should expose default admin API key configuration", async () => {
    delete process.env.ADMIN_API_KEY_HEADER;
    delete process.env.ADMIN_API_KEY;

    vi.resetModules();

    const { env } = await import("./env.js");

    expect(env.ADMIN_API_KEY_HEADER).toBe("x-admin-api-key");
    expect(env.ADMIN_API_KEY).toBe("local-admin-key");
  });

  it("should expose custom admin API key configuration", async () => {
    process.env.ADMIN_API_KEY_HEADER = "x-custom-admin-key";
    process.env.ADMIN_API_KEY = "custom-admin-key";

    vi.resetModules();

    const { env } = await import("./env.js");

    expect(env.ADMIN_API_KEY_HEADER).toBe("x-custom-admin-key");
    expect(env.ADMIN_API_KEY).toBe("custom-admin-key");
  });
});