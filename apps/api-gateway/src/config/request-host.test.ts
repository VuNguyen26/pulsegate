import { describe, expect, it } from "vitest";

import {
  normalizeConfiguredRequestHost,
  parseRequestHostHeader,
} from "./request-host.js";

describe("request host normalization", () => {
  it.each([
    ["Api.Example.COM.", "api.example.com"],
    ["localhost", "localhost"],
    ["127.0.0.1", "127.0.0.1"],
    ["[::1]", "[::1]"],
  ])(
    "normalizes configured host %s",
    (input, expected) => {
      expect(
        normalizeConfiguredRequestHost(input),
      ).toBe(expected);
    },
  );

  it("rejects ports in configured route hosts", () => {
    expect(() =>
      normalizeConfiguredRequestHost(
        "api.example.com:443",
      ),
    ).toThrow(/must not include a port/);
  });

  it.each([
    ["Api.Example.COM:3000", "api.example.com"],
    ["api.example.com.", "api.example.com"],
    ["127.0.0.1:3000", "127.0.0.1"],
    ["[::1]:3000", "[::1]"],
  ])(
    "normalizes Host header %s",
    (input, expected) => {
      expect(parseRequestHostHeader(input)).toEqual({
        ok: true,
        requestHost: expected,
      });
    },
  );

  it.each([
    undefined,
    "",
    " api.example.com",
    "api.example.com ",
    "first.example.com, second.example.com",
    "user@example.com",
    "api.example.com/path",
    "api.example.com?query=true",
    "api.example.com#fragment",
    "*.example.com",
    "api.example.com:0",
    "api.example.com:65536",
    "api.example.com:not-a-port",
    "2001:db8::1",
    "api..example.com",
  ])("rejects malformed Host value %s", (input) => {
    expect(parseRequestHostHeader(input)).toMatchObject({
      ok: false,
    });
  });
});