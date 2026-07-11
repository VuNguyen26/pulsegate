import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { CursorPagination } from "./cursor-pagination";

describe("CursorPagination", () => {
  it("renders forward cursor navigation state", () => {
    const html = renderToStaticMarkup(
      <CursorPagination
        description="Showing 20 of 45 events."
        hasPreviousPage={false}
        hasNextPage={true}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(html).toContain(
      'aria-label="Event pagination"',
    );
    expect(html).toContain(
      "Showing 20 of 45 events.",
    );
    expect(html).toContain(
      '<button class="secondary-button" type="button" disabled="">Previous page</button>',
    );
    expect(html).toContain(">Next page</button>");
  });

  it("disables navigation while a request is active", () => {
    const html = renderToStaticMarkup(
      <CursorPagination
        description="Loading the next page."
        hasPreviousPage={true}
        hasNextPage={true}
        busy
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(html).toContain('aria-busy="true"');
    expect(
      html.match(/disabled=""/g),
    ).toHaveLength(2);
  });
});
