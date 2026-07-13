import {
  readdirSync,
  readFileSync,
} from "node:fs";

import Fastify from "fastify";
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createAdminApiKeyAuthMiddleware,
} from "./admin-api-key-auth.middleware.js";

const EXPECTED_ADMIN_ROUTES = [
  "DELETE /internal/admin/routes/:id",
  "GET /internal/admin/analytics/retention-preview",
  "GET /internal/admin/analytics/rollups",
  "GET /internal/admin/analytics/scheduler-preview",
  "GET /internal/admin/api-keys/:id/quota",
  "GET /internal/admin/api-rejections/events",
  "GET /internal/admin/api-rejections/summary",
  "GET /internal/admin/consumers",
  "GET /internal/admin/consumers/:consumerId/api-keys",
  "GET /internal/admin/consumers/:id",
  "GET /internal/admin/routes",
  "GET /internal/admin/routes/:id",
  "GET /internal/admin/routes/runtime",
  "GET /internal/admin/usage/api-keys/:apiKeyId/summary",
  "GET /internal/admin/usage/consumers/:consumerId/summary",
  "GET /internal/admin/usage/events",
  "GET /internal/admin/usage-plans",
  "GET /internal/admin/usage-plans/:id",
  "GET /internal/admin/usage-plans/:id/usage-summary",
  "PATCH /internal/admin/api-keys/:id/revoke",
  "PATCH /internal/admin/api-keys/:id/usage-plan",
  "PATCH /internal/admin/consumers/:id",
  "PATCH /internal/admin/routes/:id",
  "PATCH /internal/admin/usage-plans/:id",
  "POST /internal/admin/consumers",
  "POST /internal/admin/consumers/:consumerId/api-keys",
  "POST /internal/admin/routes",
  "POST /internal/admin/routes/reload",
  "POST /internal/admin/usage-plans",
] as const;

type AdminMethod =
  | "GET"
  | "POST"
  | "PATCH"
  | "DELETE";

function discoverAdminRoutes(): string[] {
  const routeDirectory =
    new URL("../routes/", import.meta.url);

  const routeFiles =
    readdirSync(routeDirectory)
      .filter((file) =>
        /^admin-.*\.route\.ts$/.test(file),
      )
      .sort();

  const discovered: string[] = [];

  for (const routeFile of routeFiles) {
    const source =
      readFileSync(
        new URL(
          `../routes/${routeFile}`,
          import.meta.url,
        ),
        "utf8",
      );

    const lines =
      source.split(/\r?\n/);

    for (
      let lineIndex = 0;
      lineIndex < lines.length;
      lineIndex += 1
    ) {
      const methodMatch =
        lines[lineIndex]?.match(
          /\bapp\.(get|post|put|patch|delete|head|options)\b/i,
        );

      if (!methodMatch?.[1]) {
        continue;
      }

      const method =
        methodMatch[1].toUpperCase();

      const searchEnd =
        Math.min(
          lineIndex + 35,
          lines.length - 1,
        );

      for (
        let candidateIndex = lineIndex;
        candidateIndex <= searchEnd;
        candidateIndex += 1
      ) {
        const candidate =
          lines[candidateIndex] ?? "";

        if (
          candidateIndex > lineIndex &&
          /\bapp\.(get|post|put|patch|delete|head|options)\b/i.test(
            candidate,
          )
        ) {
          break;
        }

        const pathMatch =
          candidate.match(
            /["'](\/internal\/admin[^"']*)["']/,
          );

        if (!pathMatch?.[1]) {
          continue;
        }

        discovered.push(
          `${method} ${pathMatch[1]}`,
        );

        break;
      }
    }
  }

  return discovered.sort();
}

async function buildProbe() {
  const app =
    Fastify({
      logger: false,
    });

  const guard =
    createAdminApiKeyAuthMiddleware({
      headerName: "x-admin-api-key",
      apiKey: "full-access-test-key",
      readOnlyApiKey: "read-only-test-key",
    });

  for (
    let index = 0;
    index < EXPECTED_ADMIN_ROUTES.length;
    index += 1
  ) {
    const route =
      EXPECTED_ADMIN_ROUTES[index];

    const method =
      route.split(" ", 1)[0] as AdminMethod;

    app.route({
      method,
      url: `/authorization-probe/${index}`,
      preHandler: guard,
      handler: async () => ({
        data: {
          allowed: true,
        },
      }),
    });
  }

  await app.ready();

  return app;
}

describe("Admin authorization matrix", () => {
  it("keeps the global Admin route boundary registered once", () => {
    const source =
      readFileSync(
        new URL("../app.ts", import.meta.url),
        "utf8",
      );

    const registrations =
      source.match(
        /app\.addHook\("onRoute", assertAdminRouteAuthBoundary\);/g,
      ) ?? [];

    expect(registrations).toHaveLength(1);
  });

  it("locks the exact 29-route Admin matrix", () => {
    const discovered =
      discoverAdminRoutes();

    expect(discovered).toEqual(
      [...EXPECTED_ADMIN_ROUTES].sort(),
    );

    expect(
      discovered.filter((route) =>
        route.startsWith("GET "),
      ),
    ).toHaveLength(18);

    expect(
      discovered.filter((route) =>
        !route.startsWith("GET "),
      ),
    ).toHaveLength(11);
  });

  it("allows the read-only key only for read routes", async () => {
    const app =
      await buildProbe();

    try {
      for (
        let index = 0;
        index < EXPECTED_ADMIN_ROUTES.length;
        index += 1
      ) {
        const route =
          EXPECTED_ADMIN_ROUTES[index];

        const method =
          route.split(" ", 1)[0] as AdminMethod;

        const response =
          await app.inject({
            method,
            url: `/authorization-probe/${index}`,
            headers: {
              "x-admin-api-key":
                "read-only-test-key",
            },
          });

        if (method === "GET") {
          expect(
            response.statusCode,
            route,
          ).toBe(200);

          continue;
        }

        expect(
          response.statusCode,
          route,
        ).toBe(403);

        expect(response.json()).toMatchObject({
          error: {
            code: "ADMIN_API_KEY_READ_ONLY",
            message:
              "Admin API key is read-only",
            requestId: expect.any(String),
          },
        });
      }
    } finally {
      await app.close();
    }
  });

  it("preserves full access for all Admin routes", async () => {
    const app =
      await buildProbe();

    try {
      for (
        let index = 0;
        index < EXPECTED_ADMIN_ROUTES.length;
        index += 1
      ) {
        const route =
          EXPECTED_ADMIN_ROUTES[index];

        const method =
          route.split(" ", 1)[0] as AdminMethod;

        const response =
          await app.inject({
            method,
            url: `/authorization-probe/${index}`,
            headers: {
              "x-admin-api-key":
                "full-access-test-key",
            },
          });

        expect(
          response.statusCode,
          route,
        ).toBe(200);
      }
    } finally {
      await app.close();
    }
  });
});