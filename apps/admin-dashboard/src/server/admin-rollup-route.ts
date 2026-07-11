import {
  parseDashboardRollupSearchParams,
  type DashboardRollupQuery,
} from "../lib/admin-rollup-query";

export type AdminRollupRequestQueryResult =
  | {
      ok: true;
      query: DashboardRollupQuery;
    }
  | {
      ok: false;
      response: Response;
    };

function invalidQueryResponse(
  message: string,
): Response {
  return Response.json(
    {
      error: {
        code: "ADMIN_DASHBOARD_INVALID_QUERY",
        message,
        requestId: null,
      },
    },
    {
      status: 400,
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}

export function parseAdminRollupRequestQuery(
  request: Request,
): AdminRollupRequestQueryResult {
  const url = new URL(request.url);

  const result =
    parseDashboardRollupSearchParams(
      url.searchParams,
    );

  if (!result.ok) {
    return {
      ok: false,
      response: invalidQueryResponse(
        result.error.message,
      ),
    };
  }

  return {
    ok: true,
    query: result.value,
  };
}