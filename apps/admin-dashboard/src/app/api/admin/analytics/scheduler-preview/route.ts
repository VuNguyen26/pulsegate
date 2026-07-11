import {
  createAdminAnalyticsReadResponse,
} from "@/server/admin-analytics-route";
import {
  getAdminSchedulerPreview,
} from "@/server/admin-scheduler-preview.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function invalidQueryResponse() {
  return Response.json(
    {
      error: {
        code:
          "ADMIN_DASHBOARD_INVALID_QUERY",
        message:
          "Scheduler preview does not accept query parameters.",
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

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (url.searchParams.size > 0) {
    return invalidQueryResponse();
  }

  const result =
    await getAdminSchedulerPreview();

  return createAdminAnalyticsReadResponse(
    result,
  );
}