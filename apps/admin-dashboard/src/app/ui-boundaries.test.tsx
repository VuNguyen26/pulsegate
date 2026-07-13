import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ErrorPage from "./error";
import Loading from "./loading";
import NotFound from "./not-found";

describe("Admin Dashboard UI boundaries", () => {
  it("renders a semantic loading boundary", () => {
    const html = renderToStaticMarkup(
      <Loading />,
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-busy="true"');
    expect(
      html.match(/aria-hidden="true"/g),
    ).toHaveLength(2);
  });

  it("keeps primary actions keyboard-visible", () => {
    const styles = readFileSync(
      join(process.cwd(), "src", "app", "globals.css"),
      "utf8",
    );

    expect(styles).toContain(
      ".primary-button:focus-visible",
    );
    expect(styles).toContain(
      ".secondary-button:focus-visible",
    );
    expect(styles.replace(/\r\n/g, "\n")).toContain(
      `.primary-button:focus-visible,
.secondary-button:focus-visible {
  outline: 2px solid #334155;
  outline-offset: 2px;
}`,
    );
  });
  it("renders a bounded alert with a safe retry action", () => {
    const html = renderToStaticMarkup(
      <ErrorPage
        error={new Error("Synthetic render failure.")}
        reset={() => undefined}
      />,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("Unable to render this page");
    expect(html).toContain(">Try again<");
    expect(html).not.toContain("ADMIN_API_KEY");
    expect(html).not.toContain("ADMIN_READ_ONLY_API_KEY");
  });

  it("renders a semantic not-found recovery link", () => {
    const html = renderToStaticMarkup(
      <NotFound />,
    );

    expect(html).toContain("Page not found");
    expect(html).toContain("Return to overview");
    expect(html).toContain('href="/"');
  });
});
