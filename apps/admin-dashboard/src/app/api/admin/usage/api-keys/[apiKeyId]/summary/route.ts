import {
  createAdminAnalyticsReadResponse,
  parseAdminAnalyticsRequestQuery,
} from "@/server/admin-analytics-route";
import {
  getAdminApiKeyUsageSummary,
} from "@/server/admin-usage-analytics.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApiKeyUsageSummaryRouteContext = {
  params: Promise<{
    apiKeyId: string;
  }>;
};

export async function GET(
  request: Request,
  context: ApiKeyUsageSummaryRouteContext,
) {
  const parsedQuery =
    parseAdminAnalyticsRequestQuery(
      request,
      "usage-summary",
    );

  if (!parsedQuery.ok) {
    return parsedQuery.response;
  }

  const { apiKeyId } = await context.params;
  const result =
    await getAdminApiKeyUsageSummary(
      apiKeyId,
      parsedQuery.query,
    );

  return createAdminAnalyticsReadResponse(result);
}
