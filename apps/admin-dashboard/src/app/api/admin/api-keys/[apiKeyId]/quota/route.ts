import {
  createAdminAnalyticsReadResponse,
  rejectAdminAnalyticsRequestQuery,
} from "@/server/admin-analytics-route";
import {
  getAdminApiKeyQuotaState,
} from "@/server/admin-usage-analytics.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApiKeyQuotaRouteContext = {
  params: Promise<{
    apiKeyId: string;
  }>;
};

export async function GET(
  request: Request,
  context: ApiKeyQuotaRouteContext,
) {
  const invalidQuery =
    rejectAdminAnalyticsRequestQuery(request);

  if (invalidQuery) {
    return invalidQuery;
  }

  const { apiKeyId } = await context.params;
  const result =
    await getAdminApiKeyQuotaState(apiKeyId);

  return createAdminAnalyticsReadResponse(result);
}
