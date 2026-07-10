import { describe, expect, it } from "vitest";

import {
  containsSensitiveAdminField,
  isBoundedArray,
  isSafeRequestId,
  readSafeRequestId,
} from "./admin-resource-contract";

describe("admin resource contract helpers", () => {
  it("accepts bounded arrays whose items pass validation", () => {
    const isString = (value: unknown): value is string =>
      typeof value === "string";

    expect(
      isBoundedArray(["one", "two"], isString, 2),
    ).toBe(true);
    expect(
      isBoundedArray(["one", "two", "three"], isString, 2),
    ).toBe(false);
    expect(
      isBoundedArray(["one", 2], isString, 2),
    ).toBe(false);
  });

  it("rejects invalid maximum item bounds", () => {
    const isString = (value: unknown): value is string =>
      typeof value === "string";

    expect(isBoundedArray([], isString, 0)).toBe(false);
    expect(isBoundedArray([], isString, 1_001)).toBe(false);
  });

  it("detects sensitive fields at any nesting level", () => {
    expect(
      containsSensitiveAdminField({
        data: [
          {
            id: "key_1",
            rawKey: "must-not-cross-the-bff",
          },
        ],
      }),
    ).toBe(true);

    expect(
      containsSensitiveAdminField({
        data: [
          {
            id: "key_1",
            keyPrefix: "pgk_live_safe",
          },
        ],
      }),
    ).toBe(false);
  });

  it("handles cyclic values without recursing forever", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;

    expect(containsSensitiveAdminField(cyclic)).toBe(false);
  });

  it("accepts only bounded audit-safe request IDs", () => {
    expect(isSafeRequestId("request-123:gateway")).toBe(true);
    expect(isSafeRequestId("request with spaces")).toBe(false);
    expect(isSafeRequestId("x".repeat(129))).toBe(false);
    expect(readSafeRequestId("request-123")).toBe("request-123");
    expect(readSafeRequestId("\nforged")).toBeNull();
  });
});
