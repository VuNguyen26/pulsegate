import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  AnalyticsRetentionCandidateReadRepository,
} from "./analytics-retention-candidate-read.repository.js";
import {
  createAnalyticsRetentionAdminPreviewService,
} from "./analytics-retention-admin-preview.js";

describe(
  "createAnalyticsRetentionAdminPreviewService",
  () => {
    it(
      "reads fixed dry-run candidate counts without permitting delete",
      async () => {
        const summarizeCandidates =
          vi.fn<
            AnalyticsRetentionCandidateReadRepository[
              "summarizeCandidates"
            ]
          >(async (plan) => ({
            enabled: true,
            generatedAt:
              plan.generatedAt,
            usage: {
              source: "usage",
              cutoffExclusive:
                plan.usage
                  ?.cutoffExclusive ??
                new Date(0),
              retentionDays:
                plan.usage
                  ?.retentionDays ??
                0,
              candidateCount: 12,
              dryRunOnly: true,
              deleteAllowed: false,
            },
            rejected: {
              source: "rejected",
              cutoffExclusive:
                plan.rejected
                  ?.cutoffExclusive ??
                new Date(0),
              retentionDays:
                plan.rejected
                  ?.retentionDays ??
                0,
              candidateCount: 7,
              dryRunOnly: true,
              deleteAllowed: false,
            },
          }));

        const service =
          createAnalyticsRetentionAdminPreviewService({
            summarizeCandidates,
          });

        const preview =
          await service.previewRetention(
            new Date(
              "2026-07-11T06:00:00.000Z",
            ),
          );

        expect(
          summarizeCandidates,
        ).toHaveBeenCalledTimes(1);

        const plan =
          summarizeCandidates.mock
            .calls[0]?.[0];

        expect(plan).toMatchObject({
          enabled: true,
          mode: "dry-run",
          source: "both",
          generatedAt:
            new Date(
              "2026-07-11T06:00:00.000Z",
            ),
          usage: {
            source: "usage",
            retentionDays: 90,
            dryRunOnly: true,
            deleteAllowed: false,
          },
          rejected: {
            source: "rejected",
            retentionDays: 90,
            dryRunOnly: true,
            deleteAllowed: false,
          },
        });

        expect(preview).toEqual({
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
        });
      },
    );

    it(
      "rejects an invalid preview time before repository reads",
      async () => {
        const summarizeCandidates =
          vi.fn();

        const service =
          createAnalyticsRetentionAdminPreviewService({
            summarizeCandidates,
          });

        await expect(
          service.previewRetention(
            new Date("invalid"),
          ),
        ).rejects.toThrow(
          "analytics retention plan now must be a valid Date",
        );

        expect(
          summarizeCandidates,
        ).not.toHaveBeenCalled();
      },
    );
  },
);