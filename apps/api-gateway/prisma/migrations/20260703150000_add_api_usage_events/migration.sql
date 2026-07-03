CREATE TABLE "api_usage_events" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "route_path" TEXT NOT NULL,
    "route_method" "GatewayRouteMethod" NOT NULL,
    "status_code" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "cache_status" TEXT,
    "api_key_auth_source" TEXT,
    "api_key_id" TEXT,
    "consumer_id" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "api_usage_events_occurred_at_idx"
ON "api_usage_events"("occurred_at");

CREATE INDEX "api_usage_events_consumer_id_occurred_at_idx"
ON "api_usage_events"("consumer_id", "occurred_at");

CREATE INDEX "api_usage_events_api_key_id_occurred_at_idx"
ON "api_usage_events"("api_key_id", "occurred_at");

CREATE INDEX "api_usage_events_route_method_path_occurred_at_idx"
ON "api_usage_events"("route_method", "route_path", "occurred_at");

CREATE INDEX "api_usage_events_status_code_idx"
ON "api_usage_events"("status_code");

CREATE INDEX "api_usage_events_auth_source_idx"
ON "api_usage_events"("api_key_auth_source");

ALTER TABLE "api_usage_events"
ADD CONSTRAINT "api_usage_events_api_key_id_fkey"
FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "api_usage_events"
ADD CONSTRAINT "api_usage_events_consumer_id_fkey"
FOREIGN KEY ("consumer_id") REFERENCES "api_consumers"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
