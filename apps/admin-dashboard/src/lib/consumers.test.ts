import { describe, expect, it, vi } from "vitest";

import {
  DASHBOARD_ADMIN_RESOURCE_PATHS,
} from "./admin-resource-contract";
import {
  MAX_DASHBOARD_CONSUMERS,
  formatDashboardConsumerTimestamp,
  isDashboardConsumerList,
  loadDashboardConsumers,
  summarizeDashboardConsumers,
  type DashboardConsumer,
} from "./consumers";

const activeConsumer: DashboardConsumer = {
  id: "consumer_mobile",
  name: "Mobile App",
  description: "Main mobile application",
  status: "ACTIVE",
  createdAt: "2026-07-03T00:00:00.000Z",
  updatedAt: "2026-07-03T01:00:00.000Z",
  createdBy: "admin",
  updatedBy: "admin",
};

const disabledConsumer: DashboardConsumer = {
  id: "consumer_partner",
  name: "Partner App",
  description: null,
  status: "DISABLED",
  createdAt: "2026-07-03T00:00:00.000Z",
  updatedAt: "2026-07-03T01:00:00.000Z",
  createdBy: null,
  updatedBy: null,
};

describe("Dashboard consumer contract", () => {
  it("loads consumers only through the fixed BFF GET endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: [activeConsumer, disabledConsumer],
      }),
    );

    const result = await loadDashboardConsumers(
      fetchMock,
    );

    expect(result).toEqual({
      status: "success",
      data: [activeConsumer, disabledConsumer],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      DASHBOARD_ADMIN_RESOURCE_PATHS.consumers,
      {
        method: "GET",
        headers: {
          accept: "application/json",
        },
        cache: "no-store",
      },
    );

    expect(
      JSON.stringify(fetchMock.mock.calls),
    ).not.toContain("x-admin-api-key");
  });

  it("accepts the exact bounded consumer list contract", () => {
    expect(
      isDashboardConsumerList([
        activeConsumer,
        disabledConsumer,
      ]),
    ).toBe(true);

    expect(isDashboardConsumerList([])).toBe(true);
  });

  it("rejects an invalid consumer status or timestamp", () => {
    expect(
      isDashboardConsumerList([
        {
          ...activeConsumer,
          status: "PENDING",
        },
      ]),
    ).toBe(false);

    expect(
      isDashboardConsumerList([
        {
          ...activeConsumer,
          updatedAt: "not-a-date",
        },
      ]),
    ).toBe(false);
  });

  it("rejects an unbounded list", () => {
    expect(
      isDashboardConsumerList(
        Array.from(
          {
            length: MAX_DASHBOARD_CONSUMERS + 1,
          },
          (_, index) => ({
            ...activeConsumer,
            id: `consumer_${index}`,
          }),
        ),
      ),
    ).toBe(false);
  });

  it("rejects sensitive API key material", async () => {
    const result = await loadDashboardConsumers(
      async () =>
        Response.json({
          data: [
            {
              ...activeConsumer,
              rawKey: "must-not-reach-browser",
            },
          ],
        }),
    );

    expect(result).toMatchObject({
      status: "error",
      error: {
        code: "ADMIN_DASHBOARD_INVALID_RESPONSE",
      },
    });
    expect(JSON.stringify(result)).not.toContain(
      "must-not-reach-browser",
    );
  });

  it("summarizes statuses and formats audited timestamps", () => {
    expect(
      summarizeDashboardConsumers([
        activeConsumer,
        disabledConsumer,
      ]),
    ).toEqual({
      total: 2,
      active: 1,
      disabled: 1,
    });

    expect(
      formatDashboardConsumerTimestamp(
        "2026-07-03T01:00:00.000Z",
      ),
    ).toBe("2026-07-03 01:00:00.000 UTC");
  });
});
