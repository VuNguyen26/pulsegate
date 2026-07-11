import {
  createAdminAnalyticsReadResponse,
  parseAdminAnalyticsRequestQuery,
} from "@/server/admin-analytics-route";
import {
  getAdminConsumerUsageSummary,
} from "@/server/admin-usage-analytics.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ConsumerUsageSummaryRouteContext = {
  params: Promise<{
    consumerId: string;
  }>;
};

export async function GET(
  request: Request,
  context: ConsumerUsageSummaryRouteContext,
) {
  const parsedQuery =
    parseAdminAnalyticsRequestQuery(
      request,
      "usage-summary",
    );

  if (!parsedQuery.ok) {
    return parsedQuery.response;
  }

  const { consumerId } = await context.params;
  const result =
    await getAdminConsumerUsageSummary(
      consumerId,
      parsedQuery.query,
    );

  return createAdminAnalyticsReadResponse(result);
}
