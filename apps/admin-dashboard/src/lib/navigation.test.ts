import { describe, expect, it } from "vitest";

import {
  dashboardNavigation,
  findNavigationItem,
} from "./navigation";

describe("dashboardNavigation", () => {
  it("keeps every route unique", () => {
    const hrefs = dashboardNavigation.map((item) => item.href);

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("keeps future sections outside Sprint 61", () => {
    const futureItems = dashboardNavigation.filter(
      (item) => item.href !== "/",
    );

    expect(
      futureItems.every((item) => item.plannedSprint > 61),
    ).toBe(true);
  });

  it("finds a navigation item by pathname", () => {
    expect(findNavigationItem("/scheduler")?.plannedSprint).toBe(64);
    expect(findNavigationItem("/missing")).toBeUndefined();
  });
});