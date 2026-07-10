import {
  getAdminUsagePlan,
} from "@/server/admin-usage-plans.server";
import {
  mapAdminReadResourceResponse,
} from "@/server/admin-read-resource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UsagePlanRouteContext = {
  params: Promise<{
    usagePlanId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: UsagePlanRouteContext,
) {
  const { usagePlanId } = await context.params;
  const result =
    await getAdminUsagePlan(usagePlanId);
  const response =
    mapAdminReadResourceResponse(result);

  return Response.json(response.body, {
    status: response.status,
    headers: {
      "cache-control": "no-store",
    },
  });
}
