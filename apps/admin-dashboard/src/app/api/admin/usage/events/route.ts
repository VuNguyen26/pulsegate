import {
  createAdminAnalyticsReadResponse,
  parseAdminAnalyticsRequestQuery,
} from "@/server/admin-analytics-route";
import {
  getAdminUsageEvents,
} from "@/server/admin-usage-analytics.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const parsedQuery =
    parseAdminAnalyticsRequestQuery(
      request,
      "usage-events",
    );

  if (!parsedQuery.ok) {
    return parsedQuery.response;
  }

  const result = await getAdminUsageEvents(
    parsedQuery.query,
  );

  return createAdminAnalyticsReadResponse(result);
}
