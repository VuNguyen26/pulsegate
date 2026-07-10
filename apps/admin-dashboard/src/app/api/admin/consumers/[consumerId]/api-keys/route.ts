import {
  getAdminConsumerApiKeys,
} from "@/server/admin-consumer-api-keys.server";
import {
  mapAdminReadResourceResponse,
} from "@/server/admin-read-resource";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ConsumerApiKeysRouteContext = {
  params: Promise<{
    consumerId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: ConsumerApiKeysRouteContext,
) {
  const { consumerId } = await context.params;
  const result =
    await getAdminConsumerApiKeys(consumerId);
  const response =
    mapAdminReadResourceResponse(result);

  return Response.json(response.body, {
    status: response.status,
    headers: {
      "cache-control": "no-store",
    },
  });
}
