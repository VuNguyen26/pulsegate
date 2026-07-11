import {
  describe,
  expect,
  it,
} from "vitest";

import {
  isDashboardRetentionPreview,
} from "./admin-retention-preview";

function createPreview() {
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
  "isDashboardRetentionPreview",
  () => {
    it(
      "accepts a fixed dry-run candidate-count preview",
      () => {
        expect(
          isDashboardRetentionPreview(
            createPreview(),
          ),
        ).toBe(true);
      },
    );

    it(
      "rejects delete permission, execution and extra fields",
      () => {
        expect(
          isDashboardRetentionPreview({
            ...createPreview(),
            deleteAllowed: true,
          }),
        ).toBe(false);

        expect(
          isDashboardRetentionPreview({
            ...createPreview(),
            executesRetention: true,
          }),
        ).toBe(false);

        expect(
          isDashboardRetentionPreview({
            ...createPreview(),
            secret: "must-not-cross-bff",
          }),
        ).toBe(false);
      },
    );

    it(
      "rejects invalid candidate counts and cutoffs",
      () => {
        const preview =
          createPreview();

        expect(
          isDashboardRetentionPreview({
            ...preview,
            candidates: {
              ...preview.candidates,
              usage: {
                ...preview.candidates.usage,
                candidateCount: -1,
              },
            },
          }),
        ).toBe(false);

        expect(
          isDashboardRetentionPreview({
            ...preview,
            candidates: {
              ...preview.candidates,
              rejected: {
                ...preview.candidates.rejected,
                cutoffExclusive:
                  preview.generatedAt,
              },
            },
          }),
        ).toBe(false);
      },
    );
  },
);