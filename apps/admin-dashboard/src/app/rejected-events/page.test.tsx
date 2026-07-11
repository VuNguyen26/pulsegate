import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import RejectedEventsPage, {
  metadata,
} from "./page";

describe("RejectedEventsPage", () => {
  it("publishes the expected metadata", () => {
    expect(metadata).toEqual({
      title: "Rejected events",
    });
  });

  it("renders a dedicated read-only rejected-events surface", () => {
    const html = renderToStaticMarkup(
      <RejectedEventsPage />,
    );

    expect(html).toContain(
      "<h1>Rejected events</h1>",
    );
    expect(html).toContain(
      "Rejection summary and events",
    );
    expect(html).toContain(
      "remain separate from successful usage totals",
    );
    expect(html).toContain(
      "raw rejection metadata is never rendered",
    );
    expect(html).toContain(
      "Offset pagination",
    );
    expect(html).toContain(
      "mutation controls are not exposed",
    );
    expect(html).not.toContain(
      "Foundation placeholder",
    );
    expect(html).not.toContain("rawKey");
  });
});
