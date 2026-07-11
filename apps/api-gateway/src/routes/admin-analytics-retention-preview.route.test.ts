import Fastify, {
  type FastifyInstance,
} from "fastify";
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  AnalyticsRetentionAdminPreview,
} from "../analytics/analytics-retention-admin-preview.js";
import {
  adminAnalyticsRetentionPreviewRoute,
} from "./admin-analytics-retention-preview.route.js";

const preview:
  AnalyticsRetentionAdminPreview = {
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

async function buildTestApp(
  previewRetention = vi.fn(
    async () => preview,
  ),
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  await app.register(
    adminAnalyticsRetentionPreviewRoute,
    {
      adminApiKey:
        "test-admin-key",
      adminApiKeyHeader:
        "x-admin-api-key",
      previewRetention,
    },
  );

  return app;
}

describe(
  "adminAnalyticsRetentionPreviewRoute",
  () => {
    let app: FastifyInstance | null =
      null;

    afterEach(async () => {
      if (app) {
        await app.close();
        app = null;
      }
    });

    it(
      "rejects a request without an Admin API key",
      async () => {
        app = await buildTestApp();

        const response =
          await app.inject({
            method: "GET",
            url:
              "/internal/admin/analytics/retention-preview",
          });

        expect(response.statusCode).toBe(
          401,
        );

        expect(
          response.json(),
        ).toMatchObject({
          error: {
            code:
              "ADMIN_API_KEY_MISSING",
          },
        });
      },
    );

    it(
      "returns candidate counts through a read-only GET",
      async () => {
        const previewRetention =
          vi.fn(async () => preview);

        app = await buildTestApp(
          previewRetention,
        );

        const response =
          await app.inject({
            method: "GET",
            url:
              "/internal/admin/analytics/retention-preview",
            headers: {
              "x-admin-api-key":
                "test-admin-key",
            },
          });

        expect(response.statusCode).toBe(
          200,
        );

        expect(
          previewRetention,
        ).toHaveBeenCalledTimes(1);

        expect(
          response.json(),
        ).toEqual({
          data: preview,
        });
      },
    );

    it(
      "rejects browser-supplied retention controls",
      async () => {
        const previewRetention =
          vi.fn(async () => preview);

        app = await buildTestApp(
          previewRetention,
        );

        const response =
          await app.inject({
            method: "GET",
            url:
              "/internal/admin/analytics/retention-preview?mode=execute&confirmDelete=true",
            headers: {
              "x-admin-api-key":
                "test-admin-key",
            },
          });

        expect(response.statusCode).toBe(
          400,
        );

        expect(
          previewRetention,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "does not expose a mutation route",
      async () => {
        app = await buildTestApp();

        const response =
          await app.inject({
            method: "POST",
            url:
              "/internal/admin/analytics/retention-preview",
            headers: {
              "x-admin-api-key":
                "test-admin-key",
            },
          });

        expect(response.statusCode).toBe(
          404,
        );
      },
    );
  },
);