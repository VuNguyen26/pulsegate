import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  AdminResourceEmpty,
  AdminResourceError,
  AdminResourceLoading,
  AdminResourceTable,
} from "./admin-resource-view";

describe("admin resource view primitives", () => {
  it("renders an accessible loading state", () => {
    const html = renderToStaticMarkup(
      <AdminResourceLoading title="Consumers" />,
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Consumers");
    expect(html).toContain("read-only");
  });

  it("renders an explicit empty state", () => {
    const html = renderToStaticMarkup(
      <AdminResourceEmpty
        title="No consumers"
        description="No API consumers are currently configured."
      />,
    );

    expect(html).toContain('role="status"');
    expect(html).toContain("No consumers");
    expect(html).toContain(
      "No API consumers are currently configured.",
    );
  });

  it("renders a normalized error and retry action", () => {
    const html = renderToStaticMarkup(
      <AdminResourceError
        title="Consumers unavailable"
        error={{
          code: "ADMIN_DASHBOARD_FORBIDDEN",
          message:
            "The Dashboard is not permitted to read this resource.",
          requestId: "request-403",
        }}
        onRetry={() => undefined}
      />,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("ADMIN_DASHBOARD_FORBIDDEN");
    expect(html).toContain("request-403");
    expect(html).toContain(">Retry<");
  });

  it("renders semantic table headers, caption, and rows", () => {
    const html = renderToStaticMarkup(
      <AdminResourceTable
        caption="Configured API consumers"
        columns={[
          {
            key: "name",
            header: "Name",
            render: (row: { id: string; name: string }) =>
              row.name,
          },
          {
            key: "status",
            header: "Status",
            render: (row: { id: string; status: string }) =>
              row.status,
          },
        ]}
        rows={[
          {
            id: "consumer_1",
            name: "Mobile App",
            status: "ACTIVE",
          },
        ]}
        getRowKey={(row) => row.id}
      />,
    );

    expect(html).toContain(
      "<caption>Configured API consumers</caption>",
    );
    expect(html).toContain('<th scope="col">Name</th>');
    expect(html).toContain('<th scope="col">Status</th>');
    expect(html).toContain("<td>Mobile App</td>");
    expect(html).toContain("<td>ACTIVE</td>");
  });
});
