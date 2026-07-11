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

import {
  buildAnalyticsRollupSchedulerAdminPreview,
} from "../analytics/analytics-rollup-scheduler-admin-preview.js";
import {
  adminAnalyticsSchedulerPreviewRoute,
} from "./admin-analytics-scheduler-preview.route.js";

async function buildTestApp(options: {
  buildPreview?: typeof
    buildAnalyticsRollupSchedulerAdminPreview;
} = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  await app.register(
    adminAnalyticsSchedulerPreviewRoute,
    {
      adminApiKey: "test-admin-key",
      adminApiKeyHeader:
        "x-admin-api-key",
      buildPreview: options.buildPreview,
    },
  );

  return app;
}

describe(
  "adminAnalyticsSchedulerPreviewRoute",
  () => {
    let app: FastifyInstance | null = null;

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
              "/internal/admin/analytics/scheduler-preview",
          });

        expect(response.statusCode).toBe(401);
        expect(
          response.json(),
        ).toMatchObject({
          error: {
            code:
              "ADMIN_API_KEY_MISSING",
            requestId:
              expect.any(String),
          },
        });
      },
    );

    it(
      "returns a pure observational scheduler preview",
      async () => {
        const buildPreview = vi.fn(() =>
          buildAnalyticsRollupSchedulerAdminPreview(
            new Date(
              "2026-07-11T05:00:00.000Z",
            ),
          ),
        );

        app = await buildTestApp({
          buildPreview,
        });

        const response =
          await app.inject({
            method: "GET",
            url:
              "/internal/admin/analytics/scheduler-preview",
            headers: {
              "x-admin-api-key":
                "test-admin-key",
            },
          });

        expect(response.statusCode).toBe(200);
        expect(buildPreview).toHaveBeenCalledTimes(
          1,
        );

        expect(
          response.json(),
        ).toMatchObject({
          data: {
            kind:
              "analytics-rollup-scheduler-admin-preview",
            generatedAt:
              "2026-07-11T05:00:00.000Z",
            configurationSource:
              "dashboard-observational-defaults",
            runtimeStateAvailable:
              false,
            startsScheduledJob: false,
            invokesRuntimeAdapter:
              false,
            output: {
              summary: {
                backgroundRuntimeInvocationAllowed:
                  false,
              },
              runtimeGate: {
                summary: {
                  runtimeInvocationAllowed:
                    false,
                  runtimeFactoryResolutionAllowed:
                    false,
                  backfillServiceInvocationAllowed:
                    false,
                  executeBackfillAllowed:
                    false,
                },
              },
            },
          },
        });
      },
    );

    it(
      "rejects all browser-supplied scheduler controls",
      async () => {
        const buildPreview = vi.fn(
          buildAnalyticsRollupSchedulerAdminPreview,
        );

        app = await buildTestApp({
          buildPreview,
        });

        const response =
          await app.inject({
            method: "GET",
            url:
              "/internal/admin/analytics/scheduler-preview?trigger=external-scheduler&mode=execute&confirmExecute=true",
            headers: {
              "x-admin-api-key":
                "test-admin-key",
            },
          });

        expect(response.statusCode).toBe(400);
        expect(
          response.json(),
        ).toMatchObject({
          error: {
            code:
              "INVALID_QUERY_PARAMETER",
            requestId:
              expect.any(String),
          },
        });

        expect(
          buildPreview,
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
              "/internal/admin/analytics/scheduler-preview",
            headers: {
              "x-admin-api-key":
                "test-admin-key",
            },
          });

        expect(response.statusCode).toBe(404);
      },
    );
  },
);