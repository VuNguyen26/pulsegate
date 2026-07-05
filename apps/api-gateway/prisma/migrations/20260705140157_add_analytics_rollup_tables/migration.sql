-- CreateTable
CREATE TABLE "api_usage_rollups" (
    "id" TEXT NOT NULL,
    "granularity" TEXT NOT NULL,
    "bucket_start" TIMESTAMP(3) NOT NULL,
    "bucket_end" TIMESTAMP(3) NOT NULL,
    "dimension_hash" TEXT NOT NULL,
    "consumer_id" TEXT,
    "api_key_id" TEXT,
    "route_path" TEXT NOT NULL,
    "route_method" "GatewayRouteMethod" NOT NULL,
    "status_class" TEXT NOT NULL,
    "cache_status" TEXT,
    "api_key_auth_source" TEXT,
    "total_requests" INTEGER NOT NULL,
    "successful_requests" INTEGER NOT NULL,
    "error_requests" INTEGER NOT NULL,
    "total_duration_ms" INTEGER NOT NULL,
    "average_duration_ms" INTEGER NOT NULL,
    "cache_hits" INTEGER NOT NULL,
    "cache_misses" INTEGER NOT NULL,
    "cache_bypasses" INTEGER NOT NULL,
    "last_request_at" TIMESTAMP(3) NOT NULL,
    "rolled_up_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_usage_rollups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_rejected_rollups" (
    "id" TEXT NOT NULL,
    "granularity" TEXT NOT NULL,
    "bucket_start" TIMESTAMP(3) NOT NULL,
    "bucket_end" TIMESTAMP(3) NOT NULL,
    "dimension_hash" TEXT NOT NULL,
    "consumer_id" TEXT,
    "api_key_id" TEXT,
    "route_path" TEXT,
    "route_method" "GatewayRouteMethod",
    "rejection_reason" "ApiRejectionReason" NOT NULL,
    "status_code" INTEGER NOT NULL,
    "api_key_auth_source" TEXT,
    "total_rejected_requests" INTEGER NOT NULL,
    "last_rejected_at" TIMESTAMP(3) NOT NULL,
    "rolled_up_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_rejected_rollups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_usage_rollups_dimension_hash_key" ON "api_usage_rollups"("dimension_hash");

-- CreateIndex
CREATE INDEX "api_usage_rollups_granularity_bucket_start_idx" ON "api_usage_rollups"("granularity", "bucket_start");

-- CreateIndex
CREATE INDEX "api_usage_rollups_consumer_id_granularity_bucket_start_idx" ON "api_usage_rollups"("consumer_id", "granularity", "bucket_start");

-- CreateIndex
CREATE INDEX "api_usage_rollups_api_key_id_granularity_bucket_start_idx" ON "api_usage_rollups"("api_key_id", "granularity", "bucket_start");

-- CreateIndex
CREATE INDEX "api_usage_rollups_route_gran_bucket_idx" ON "api_usage_rollups"("route_method", "route_path", "granularity", "bucket_start");

-- CreateIndex
CREATE INDEX "api_usage_rollups_status_class_granularity_bucket_start_idx" ON "api_usage_rollups"("status_class", "granularity", "bucket_start");

-- CreateIndex
CREATE INDEX "api_usage_rollups_cache_status_granularity_bucket_start_idx" ON "api_usage_rollups"("cache_status", "granularity", "bucket_start");

-- CreateIndex
CREATE UNIQUE INDEX "api_rejected_rollups_dimension_hash_key" ON "api_rejected_rollups"("dimension_hash");

-- CreateIndex
CREATE INDEX "api_rejected_rollups_granularity_bucket_start_idx" ON "api_rejected_rollups"("granularity", "bucket_start");

-- CreateIndex
CREATE INDEX "api_rejected_rollups_consumer_id_granularity_bucket_start_idx" ON "api_rejected_rollups"("consumer_id", "granularity", "bucket_start");

-- CreateIndex
CREATE INDEX "api_rejected_rollups_api_key_id_granularity_bucket_start_idx" ON "api_rejected_rollups"("api_key_id", "granularity", "bucket_start");

-- CreateIndex
CREATE INDEX "api_rejected_rollups_route_gran_bucket_idx" ON "api_rejected_rollups"("route_method", "route_path", "granularity", "bucket_start");

-- CreateIndex
CREATE INDEX "api_rejected_rollups_reason_granularity_bucket_start_idx" ON "api_rejected_rollups"("rejection_reason", "granularity", "bucket_start");

-- CreateIndex
CREATE INDEX "api_rejected_rollups_status_code_granularity_bucket_start_idx" ON "api_rejected_rollups"("status_code", "granularity", "bucket_start");
