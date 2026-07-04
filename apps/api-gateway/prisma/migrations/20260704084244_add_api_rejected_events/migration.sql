-- CreateEnum
CREATE TYPE "ApiRejectionReason" AS ENUM ('API_KEY_MISSING', 'API_KEY_INVALID', 'JWT_TOKEN_MISSING', 'JWT_TOKEN_INVALID', 'RATE_LIMIT_EXCEEDED', 'QUOTA_EXCEEDED');

-- CreateTable
CREATE TABLE "api_rejected_events" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "route_path" TEXT,
    "route_method" "GatewayRouteMethod",
    "status_code" INTEGER NOT NULL,
    "rejection_reason" "ApiRejectionReason" NOT NULL,
    "api_key_auth_source" TEXT,
    "api_key_id" TEXT,
    "consumer_id" TEXT,
    "metadata" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_rejected_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "api_rejected_events_occurred_at_idx" ON "api_rejected_events"("occurred_at");

-- CreateIndex
CREATE INDEX "api_rejected_events_reason_occurred_at_idx" ON "api_rejected_events"("rejection_reason", "occurred_at");

-- CreateIndex
CREATE INDEX "api_rejected_events_api_key_id_occurred_at_idx" ON "api_rejected_events"("api_key_id", "occurred_at");

-- CreateIndex
CREATE INDEX "api_rejected_events_consumer_id_occurred_at_idx" ON "api_rejected_events"("consumer_id", "occurred_at");

-- CreateIndex
CREATE INDEX "api_rejected_events_route_method_path_occurred_at_idx" ON "api_rejected_events"("route_method", "route_path", "occurred_at");

-- CreateIndex
CREATE INDEX "api_rejected_events_status_code_idx" ON "api_rejected_events"("status_code");

-- CreateIndex
CREATE INDEX "api_rejected_events_auth_source_idx" ON "api_rejected_events"("api_key_auth_source");

-- AddForeignKey
ALTER TABLE "api_rejected_events" ADD CONSTRAINT "api_rejected_events_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_rejected_events" ADD CONSTRAINT "api_rejected_events_consumer_id_fkey" FOREIGN KEY ("consumer_id") REFERENCES "api_consumers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
