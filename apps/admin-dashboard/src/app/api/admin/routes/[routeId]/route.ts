import {
  getAdminRoute,
} from "@/server/admin-routes.server";
import {
  mapAdminReadResourceResponse,
} from "@/server/admin-read-resource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteDetailContext = {
  params: Promise<{
    routeId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteDetailContext,
) {
  const { routeId } = await context.params;
  const result = await getAdminRoute(routeId);
  const response =
    mapAdminReadResourceResponse(result);

  return Response.json(response.body, {
    status: response.status,
    headers: {
      "cache-control": "no-store",
    },
  });
}
