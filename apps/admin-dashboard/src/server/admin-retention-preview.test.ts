import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  DashboardAdminApiConfig,
} from "./admin-api-config";
import {
  fetchAdminRetentionPreview,
} from "./admin-retention-preview";

const config: DashboardAdminApiConfig = {
  gatewayBaseUrl:
    "http://127.0.0.1:3000",
  apiKeyHeader: "x-admin-api-key",
  readOnlyApiKey: "read-only-secret",
  requestTimeoutMs: 1_000,
  accessMode: "read-only",
};

const preview = {
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
} as const;

describe(
  "fetchAdminRetentionPreview",
  () => {
    it(
      "uses the fixed read-only Gateway endpoint",
      async () => {
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
          await fetchAdminRetentionPreview(
            config,
            fetchMock,
          );

        expect(result).toEqual({
          ok: true,
          accessMode: "read-only",
          data: preview,
        });

        expect(
          fetchMock.mock.calls[0]?.[0],
        ).toEqual(
          new URL(
            "/internal/admin/analytics/retention-preview",
            config.gatewayBaseUrl,
          ),
        );

        expect(
          fetchMock.mock.calls[0]?.[1],
        ).toMatchObject({
          method: "GET",
          cache: "no-store",
          headers: {
            accept: "application/json",
            "x-admin-api-key":
              "read-only-secret",
          },
        });
      },
    );

    it(
      "fails closed if deletion appears permitted",
      async () => {
        const result =
          await fetchAdminRetentionPreview(
            config,
            vi.fn(
              async (
                ..._args:
                  Parameters<typeof fetch>
              ) =>
                Response.json({
                  data: {
                    ...preview,
                    deleteAllowed: true,
                  },
                }),
            ),
          );

        expect(result).toMatchObject({
          ok: false,
          error: {
            code:
              "ADMIN_DASHBOARD_INVALID_RESPONSE",
          },
        });
      },
    );
  },
);