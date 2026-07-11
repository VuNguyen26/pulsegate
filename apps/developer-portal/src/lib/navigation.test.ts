import { describe, expect, it } from "vitest";

import {
  findPortalNavigationItem,
  portalNavigation,
} from "./navigation";

describe("portalNavigation", () => {
  it("keeps every route unique", () => {
    const hrefs = portalNavigation.map((item) => item.href);

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("keeps Sprint 66 areas explicitly planned", () => {
    expect(findPortalNavigationItem("/api-docs")?.status).toBe("planned");
    expect(findPortalNavigationItem("/api-keys")?.status).toBe("planned");
  });

  it("does not expose an Admin route", () => {
    expect(
      portalNavigation.some(
        (item) =>
          item.href.startsWith("/api/admin") ||
          item.href.startsWith("/internal/admin"),
      ),
    ).toBe(false);
  });
});
