import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  AnalyticsSummaryGrid,
} from "./analytics-summary-grid";

describe("AnalyticsSummaryGrid", () => {
  it("renders bounded summary facts with an accessible label", () => {
    const html = renderToStaticMarkup(
      <AnalyticsSummaryGrid
        label="Usage summary"
        items={[
          {
            key: "requests",
            label: "Total requests",
            value: 42,
          },
          {
            key: "errors",
            label: "Errors",
            value: 3,
            description: "Successful usage errors only.",
            tone: "warning",
          },
        ]}
      />,
    );

    expect(html).toContain(
      'aria-label="Usage summary"',
    );
    expect(html).toContain("Total requests");
    expect(html).toContain(">42<");
    expect(html).toContain('data-tone="warning"');
    expect(html).toContain(
      "Successful usage errors only.",
    );
  });

  it("renders an empty grid without fake values", () => {
    const html = renderToStaticMarkup(
      <AnalyticsSummaryGrid
        label="Empty summary"
        items={[]}
      />,
    );

    expect(html).toContain(
      'aria-label="Empty summary"',
    );
    expect(html).not.toContain("<article");
  });
});
