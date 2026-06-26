import { afterEach, describe, expect, it } from "vitest";

import { readCsvEnv, readNumberEnv } from "./env.js";

const TEST_NUMBER_ENV = "TEST_NUMBER_ENV";
const TEST_CSV_ENV = "TEST_CSV_ENV";

afterEach(() => {
  delete process.env[TEST_NUMBER_ENV];
  delete process.env[TEST_CSV_ENV];
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