import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ApiDocsPage from "./api-docs/page";
import ApiKeysPage from "./api-keys/page";
import ErrorPage from "./error";
import GettingStartedPage from "./getting-started/page";
import Loading from "./loading";
import NotFound from "./not-found";
import OverviewPage from "./page";

function render(component: React.ReactNode): string {
  return renderToStaticMarkup(component);
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);

    if (statSync(path).isDirectory()) {
      return sourceFiles(path);
    }

    return /\.(ts|tsx)$/.test(name) && !name.includes(".test.")
      ? [path]
      : [];
  });
}

describe("Developer Portal foundation", () => {
  it("renders the product overview and existing getting-started content", () => {
    const overview = render(<OverviewPage />);

    expect(overview).toContain("Public demo v2.0.0");
    expect(overview).toContain("One gateway.");
    expect(overview).toContain("Every request visible.");
    expect(overview).toContain("1,474");
    expect(overview).toContain("Gateway request preview");
    expect(overview).toContain("Request lifecycle");
    expect(render(<GettingStartedPage />)).toContain(
      "does not create developer accounts",
    );
  });

  it("publishes bounded API docs while API-key self-service stays planned", () => {
    const apiDocs = render(<ApiDocsPage />);

    expect(apiDocs).toContain("Public API documentation foundation");
    expect(apiDocs).toContain("/api/product-service/health");
    expect(apiDocs).toContain("/api/products");
    expect(apiDocs).toContain(
      'aria-label="HTTP error reference"',
    );
    expect(apiDocs).toContain('tabindex="0"');
    expect(apiDocs).toContain("x-api-key");
    expect(apiDocs).toContain("JWT_TOKEN_MISSING");
    expect(apiDocs).toContain("DOWNSTREAM_TIMEOUT");
    expect(apiDocs).toContain(
      "Runtime management and administrative operations are excluded",
    );
    const apiKeys = render(<ApiKeysPage />);

    expect(apiKeys).toContain("API-key self-service foundation");
    expect(apiKeys).toContain("No key will be created");
    expect(apiKeys).toContain("No public developer identity exists");
    expect(apiKeys).toContain(
      "No developer-to-consumer ownership mapping exists",
    );
    expect(apiKeys).toContain(
      "No browser-safe API-key self-service endpoint exists",
    );
    expect(apiKeys).not.toContain("Create API key");
    expect(apiKeys).not.toContain("<form");
    expect(apiKeys).not.toContain("pgk_live_");
  });

  it("provides semantic loading, error, and not-found boundaries", () => {
    const loading = render(<Loading />);
    const error = render(
      <ErrorPage reset={() => undefined} />,
    );

    expect(loading).toContain('role="status"');
    expect(loading).toContain('aria-live="polite"');
    expect(loading).toContain('aria-busy="true"');
    expect(error).toContain('role="alert"');
    expect(error).toContain(">Try again<");
    expect(render(<NotFound />)).toContain("Return to overview");
  });

  it("keeps keyboard focus visible for links and scroll regions", () => {
    const styles = readFileSync(
      join(process.cwd(), "src", "app", "globals.css"),
      "utf8",
    );

    expect(styles).toContain(".primary-link:focus-visible");
    expect(styles).toContain(
      ".code-example pre:focus-visible",
    );
    expect(styles).toContain(
      ".error-table-wrapper:focus-visible",
    );
  });

  it("provides a compact mobile navigation disclosure", () => {
    const navigation = readFileSync(
      join(
        process.cwd(),
        "src",
        "components",
        "portal-navigation.tsx",
      ),
      "utf8",
    );
    const styles = readFileSync(
      join(process.cwd(), "src", "app", "visual-system.css"),
      "utf8",
    );
    const overviewStyles = readFileSync(
      join(
        process.cwd(),
        "src",
        "components",
        "portal-overview.module.css",
      ),
      "utf8",
    );

    expect(navigation).toContain(
      'className="portal-navigation-toggle"',
    );
    expect(navigation).toContain("aria-expanded={open}");
    expect(navigation).toContain(
      'data-visual-system="p7-mobile-navigation"',
    );
    expect(styles).toContain(
      '.portal-navigation[data-open="true"]',
    );
    expect(styles).toContain(
      "width: min(1180px, calc(100% - 24px));",
    );
    expect(overviewStyles).toContain(
      "width: min(1240px, calc(100% - 24px));",
    );
  });

  it("keeps Admin and browser-secret surfaces out of Portal source", () => {
    const source = sourceFiles(join(process.cwd(), "src"))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    for (const forbidden of [
      "ADMIN_API_KEY",
      "ADMIN_READ_ONLY_API_KEY",
      "NEXT_PUBLIC_ADMIN_",
      "/internal/admin/",
      "/api/admin/",
      "localStorage",
      "sessionStorage",
      "pgk_live_",
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});
