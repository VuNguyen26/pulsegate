import { getAdminRuntimeStatus } from "@/server/admin-api-client.server";
import { mapRuntimeStatusResponse } from "@/server/admin-runtime-status-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getAdminRuntimeStatus();
  const response = mapRuntimeStatusResponse(result);

  return Response.json(response.body, {
    status: response.status,
    headers: {
      "cache-control": "no-store",
    },
  });
}