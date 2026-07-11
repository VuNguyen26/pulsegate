import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import UsageAnalyticsPage, {
  metadata,
} from "./page";

describe("UsageAnalyticsPage", () => {
  it("publishes the expected page metadata", () => {
    expect(metadata).toEqual({
      title: "Usage analytics",
    });
  });

  it("renders successful analytics separately from rejected events", () => {
    const html = renderToStaticMarkup(
      <UsageAnalyticsPage />,
    );

    expect(html).toContain(
      "<h1>Usage analytics</h1>",
    );
    expect(html).toContain(
      "Consumer usage summary",
    );
    expect(html).toContain(
      "API key usage summary",
    );
    expect(html).toContain(
      "API key quota state",
    );
    expect(html).toContain(
      "Usage plan summary",
    );
    expect(html).toContain(
      "Successful usage events",
    );
    expect(html).toContain(
      "Rejected request events remain separate",
    );
    expect(html).toContain(
      "Offset pagination and rollup switches are not exposed",
    );
    expect(html).not.toContain(
      "Foundation placeholder",
    );
  });
});
