import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  DashboardRetentionPreview,
} from "./admin-retention-preview";
import {
  loadDashboardRetentionPreview,
} from "./admin-retention-preview-client";

function createPreview():
  DashboardRetentionPreview {
  return {
    kind:
      "analytics-retention-admin-preview",
    generatedAt:
      "2026-07-11T06:00:00.000Z",
    configurationSource:
      "dashboard-observational-defaults",
    policy: {
      enabled: true,
      mode: "dry-run",
      source: "both",
      usageRetentionDays: 90,
      rejectedRetentionDays: 90,
    },
    candidates: {
      enabled: true,
      generatedAt:
        "2026-07-11T06:00:00.000Z",
      usage: {
        source: "usage",
        cutoffExclusive:
          "2026-04-12T06:00:00.000Z",
        retentionDays: 90,
        candidateCount: 12,
        dryRunOnly: true,
        deleteAllowed: false,
      },
      rejected: {
        source: "rejected",
        cutoffExclusive:
          "2026-04-12T06:00:00.000Z",
        retentionDays: 90,
        candidateCount: 7,
        dryRunOnly: true,
        deleteAllowed: false,
      },
    },
    readsCandidateCounts: true,
    dryRunOnly: true,
    deleteAllowed: false,
    importsDeleteRepository: false,
    executesRetention: false,
  };
}

describe(
  "loadDashboardRetentionPreview",
  () => {
    it(
      "loads the fixed no-store BFF resource",
      async () => {
        const preview = createPreview();

        const fetchMock = vi.fn(
          async (
            ..._args:
              Parameters<typeof fetch>
          ) =>
            Response.json({
              data: preview,
            }),
        );

        const result =
          await loadDashboardRetentionPreview(
            fetchMock,
          );

        expect(result).toEqual({
          status: "success",
          data: preview,
        });

        expect(
          fetchMock.mock.calls[0]?.[0],
        ).toBe(
          "/api/admin/analytics/retention-preview",
        );

        expect(
          fetchMock.mock.calls[0]?.[1],
        ).toMatchObject({
          cache: "no-store",
          headers: {
            accept: "application/json",
          },
        });
      },
    );

    it(
      "fails closed on an execution-enabled response",
      async () => {
        const preview = createPreview();

        const result =
          await loadDashboardRetentionPreview(
            vi.fn(
              async (
                ..._args:
                  Parameters<typeof fetch>
              ) =>
                Response.json({
                  data: {
                    ...preview,
                    executesRetention: true,
                  },
                }),
            ),
          );

        expect(result).toMatchObject({
          status: "error",
          error: {
            code:
              "ADMIN_DASHBOARD_INVALID_RESPONSE",
          },
        });
      },
    );
  },
);