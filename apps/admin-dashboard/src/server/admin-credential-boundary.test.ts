import {
  readdirSync,
  readFileSync,
} from "node:fs";
import {
  join,
  relative,
  sep,
} from "node:path";
import { fileURLToPath } from "node:url";

import {
  describe,
  expect,
  it,
} from "vitest";

const sourceRoot =
  fileURLToPath(
    new URL("../", import.meta.url),
  );

const adminApiRoot =
  join(
    sourceRoot,
    "app",
    "api",
    "admin",
  );

const EXPECTED_BFF_ROUTES = [
  "analytics/retention-preview/route.ts",
  "analytics/rollups/route.ts",
  "analytics/scheduler-preview/route.ts",
  "api-keys/[apiKeyId]/quota/route.ts",
  "api-rejections/events/route.ts",
  "api-rejections/summary/route.ts",
  "consumers/[consumerId]/api-keys/route.ts",
  "consumers/route.ts",
  "routes/[routeId]/route.ts",
  "routes/route.ts",
  "routes/runtime/route.ts",
  "runtime-status/route.ts",
  "usage/api-keys/[apiKeyId]/summary/route.ts",
  "usage/consumers/[consumerId]/summary/route.ts",
  "usage/events/route.ts",
  "usage-plans/[usagePlanId]/route.ts",
  "usage-plans/[usagePlanId]/usage-summary/route.ts",
  "usage-plans/route.ts",
] as const;

const HTTP_METHOD_EXPORT_PATTERN =
  /export\s+(?:(?:async\s+)?function|const)\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g;

const ADMIN_CREDENTIAL_PATTERN =
  /\bADMIN_API_KEY\b|\bADMIN_READ_ONLY_API_KEY\b|\bADMIN_API_KEY_HEADER\b|x-admin-api-key|NEXT_PUBLIC_/;

function listFilesRecursively(
  directory: string,
): string[] {
  const files: string[] = [];

  for (
    const entry of readdirSync(
      directory,
      {
        withFileTypes: true,
      },
    )
  ) {
    const path =
      join(
        directory,
        entry.name,
      );

    if (entry.isDirectory()) {
      files.push(
        ...listFilesRecursively(path),
      );

      continue;
    }

    files.push(path);
  }

  return files;
}

function normalizeRelativePath(
  root: string,
  path: string,
): string {
  return relative(root, path)
    .split(sep)
    .join("/");
}

describe("Admin Dashboard credential boundary", () => {
  it("keeps exactly 18 fixed GET-only BFF routes", () => {
    const routeFiles =
      listFilesRecursively(adminApiRoot)
        .filter((path) =>
          path.endsWith(
            `${sep}route.ts`,
          ),
        )
        .map((path) =>
          normalizeRelativePath(
            adminApiRoot,
            path,
          ),
        )
        .sort();

    expect(routeFiles).toEqual(
      [...EXPECTED_BFF_ROUTES].sort(),
    );

    expect(routeFiles).toHaveLength(18);

    expect(
      routeFiles.some((path) =>
        path.includes("[..."),
      ),
    ).toBe(false);

    for (const routePath of routeFiles) {
      const source =
        readFileSync(
          join(
            adminApiRoot,
            ...routePath.split("/"),
          ),
          "utf8",
        );

      const exportedMethods =
        Array.from(
          source.matchAll(
            HTTP_METHOD_EXPORT_PATTERN,
          ),
          (match) => match[1],
        );

      expect(
        exportedMethods,
        routePath,
      ).toEqual(["GET"]);
    }
  });

  it("preserves explicit server-only configuration and client entrypoints", () => {
    const configServerSource =
      readFileSync(
        join(
          sourceRoot,
          "server",
          "admin-api-config.server.ts",
        ),
        "utf8",
      );

    const clientServerSource =
      readFileSync(
        join(
          sourceRoot,
          "server",
          "admin-api-client.server.ts",
        ),
        "utf8",
      );

    expect(configServerSource).toMatch(
      /^import "server-only";/m,
    );

    expect(clientServerSource).toMatch(
      /^import "server-only";/m,
    );
  });

  it("uses only the read-only credential in the Dashboard Admin client", () => {
    const configSource =
      readFileSync(
        join(
          sourceRoot,
          "server",
          "admin-api-config.ts",
        ),
        "utf8",
      );

    const clientSource =
      readFileSync(
        join(
          sourceRoot,
          "server",
          "admin-api-client.ts",
        ),
        "utf8",
      );

    const readResourceSource =
      readFileSync(
        join(
          sourceRoot,
          "server",
          "admin-read-resource.ts",
        ),
        "utf8",
      );

    expect(configSource).toContain(
      "ADMIN_READ_ONLY_API_KEY",
    );

    expect(configSource).not.toMatch(
      /\bADMIN_API_KEY\b/,
    );

    expect(clientSource).toContain(
      "[config.apiKeyHeader]: config.readOnlyApiKey",
    );

    expect(readResourceSource).toContain(
      "[config.apiKeyHeader]: config.readOnlyApiKey",
    );

    expect(clientSource).not.toMatch(
      /\bADMIN_API_KEY\b/,
    );

    expect(readResourceSource).not.toMatch(
      /\bADMIN_API_KEY\b/,
    );
  });

  it("keeps Admin credential markers out of production client surfaces", () => {
    const clientSurfaceRoots = [
      join(sourceRoot, "app"),
      join(sourceRoot, "components"),
      join(sourceRoot, "lib"),
    ];

    const exposedFiles: string[] = [];

    for (const root of clientSurfaceRoots) {
      const productionFiles =
        listFilesRecursively(root)
          .filter((path) =>
            /\.(ts|tsx)$/.test(path),
          )
          .filter((path) =>
            !/\.test\.(ts|tsx)$/.test(path),
          );

      for (const path of productionFiles) {
        const source =
          readFileSync(
            path,
            "utf8",
          );

        if (
          ADMIN_CREDENTIAL_PATTERN.test(
            source,
          )
        ) {
          exposedFiles.push(
            normalizeRelativePath(
              sourceRoot,
              path,
            ),
          );
        }
      }
    }

    expect(exposedFiles).toEqual([]);
  });
});