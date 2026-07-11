import {
  renderToStaticMarkup,
} from "react-dom/server";
import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  DashboardRetentionPreview,
} from "../lib/admin-retention-preview";
import {
  RetentionPreviewContent,
  RetentionPreviewPanel,
} from "./retention-preview-panel";

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
  "RetentionPreviewContent",
  () => {
    it(
      "renders candidate counts and non-destructive evidence",
      () => {
        const html =
          renderToStaticMarkup(
            <RetentionPreviewContent
              preview={createPreview()}
            />,
          );

        expect(html).toContain(
          "Usage candidates",
        );
        expect(html).toContain(
          "Rejected candidates",
        );
        expect(html).toContain(
          "Usage deletion candidates",
        );
        expect(html).toContain(
          "Rejected-event deletion candidates",
        );
        expect(html).toContain(
          "Safety evidence",
        );
        expect(html).toContain(
          "Delete repository imported",
        );
        expect(html).not.toContain(
          ">Execute<",
        );
        expect(html).not.toContain(
          ">Delete<",
        );
      },
    );
  },
);

describe(
  "RetentionPreviewPanel",
  () => {
    it(
      "starts in a read-only loading state",
      () => {
        const html =
          renderToStaticMarkup(
            <RetentionPreviewPanel />,
          );

        expect(html).toContain(
          'aria-label="Analytics retention preview"',
        );
        expect(html).toContain(
          "Refresh preview",
        );
        expect(html).toContain(
          "Reading bounded candidate counts",
        );
        expect(html).toContain(
          "cannot execute retention",
        );
      },
    );
  },
);