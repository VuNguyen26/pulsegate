import {
  createAdminAnalyticsReadResponse,
  parseAdminAnalyticsRequestQuery,
} from "@/server/admin-analytics-route";
import {
  getAdminRejectedEventsSummary,
} from "@/server/admin-rejected-analytics.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const parsedQuery =
    parseAdminAnalyticsRequestQuery(
      request,
      "rejected-summary",
    );

  if (!parsedQuery.ok) {
    return parsedQuery.response;
  }

  const result =
    await getAdminRejectedEventsSummary(
      parsedQuery.query,
    );

  return createAdminAnalyticsReadResponse(result);
}
