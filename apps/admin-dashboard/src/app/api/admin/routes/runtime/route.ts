import {
  getAdminRouteRuntime,
} from "@/server/admin-routes.server";
import {
  mapAdminReadResourceResponse,
} from "@/server/admin-read-resource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result =
    await getAdminRouteRuntime();
  const response =
    mapAdminReadResourceResponse(result);

  return Response.json(response.body, {
    status: response.status,
    headers: {
      "cache-control": "no-store",
    },
  });
}
