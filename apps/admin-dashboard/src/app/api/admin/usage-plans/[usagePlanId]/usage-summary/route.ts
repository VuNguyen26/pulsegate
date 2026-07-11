import {
  createAdminAnalyticsReadResponse,
  rejectAdminAnalyticsRequestQuery,
} from "@/server/admin-analytics-route";
import {
  getAdminUsagePlanUsageSummary,
} from "@/server/admin-usage-analytics.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UsagePlanUsageSummaryRouteContext = {
  params: Promise<{
    usagePlanId: string;
  }>;
};

export async function GET(
  request: Request,
  context: UsagePlanUsageSummaryRouteContext,
) {
  const invalidQuery =
    rejectAdminAnalyticsRequestQuery(request);

  if (invalidQuery) {
    return invalidQuery;
  }

  const { usagePlanId } = await context.params;
  const result =
    await getAdminUsagePlanUsageSummary(
      usagePlanId,
    );

  return createAdminAnalyticsReadResponse(result);
}
