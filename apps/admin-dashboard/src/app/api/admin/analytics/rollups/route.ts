import {
  createAdminAnalyticsReadResponse,
} from "@/server/admin-analytics-route";
import {
  parseAdminRollupRequestQuery,
} from "@/server/admin-rollup-route";
import {
  getAdminRollups,
} from "@/server/admin-rollups.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const parsedQuery =
    parseAdminRollupRequestQuery(request);

  if (!parsedQuery.ok) {
    return parsedQuery.response;
  }

  const result = await getAdminRollups(
    parsedQuery.query,
  );

  return createAdminAnalyticsReadResponse(
    result,
  );
}