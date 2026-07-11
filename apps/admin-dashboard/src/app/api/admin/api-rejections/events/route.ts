import {
  createAdminAnalyticsReadResponse,
  parseAdminAnalyticsRequestQuery,
} from "@/server/admin-analytics-route";
import {
  getAdminRejectedEvents,
} from "@/server/admin-rejected-analytics.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const parsedQuery =
    parseAdminAnalyticsRequestQuery(
      request,
      "rejected-events",
    );

  if (!parsedQuery.ok) {
    return parsedQuery.response;
  }

  const result = await getAdminRejectedEvents(
    parsedQuery.query,
  );

  return createAdminAnalyticsReadResponse(result);
}
