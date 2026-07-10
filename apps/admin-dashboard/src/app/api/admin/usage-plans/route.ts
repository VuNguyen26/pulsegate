import {
  getAdminUsagePlans,
} from "@/server/admin-usage-plans.server";
import {
  mapAdminReadResourceResponse,
} from "@/server/admin-read-resource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getAdminUsagePlans();
  const response =
    mapAdminReadResourceResponse(result);

  return Response.json(response.body, {
    status: response.status,
    headers: {
      "cache-control": "no-store",
    },
  });
}
