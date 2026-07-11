import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ApiDocsPage from "./api-docs/page";
import ApiKeysPage from "./api-keys/page";
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
  it("renders real Sprint 65 overview and getting-started content", () => {
    expect(render(<OverviewPage />)).toContain("Sprint 65");
    expect(render(<GettingStartedPage />)).toContain(
      "does not create developer accounts",
    );
  });

  it("keeps Sprint 66 areas honest placeholders", () => {
    expect(render(<ApiDocsPage />)).toContain("Planned for Sprint 66");
    expect(render(<ApiKeysPage />)).toContain("not available in Sprint 65");
  });

  it("provides loading and not-found boundaries", () => {
    expect(render(<Loading />)).toContain('aria-busy="true"');
    expect(render(<NotFound />)).toContain("Return to overview");
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
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});
