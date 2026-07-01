-- CreateEnum
CREATE TYPE "GatewayRouteMethod" AS ENUM ('GET', 'POST', 'PUT', 'PATCH', 'DELETE');

-- CreateTable
CREATE TABLE "gateway_routes" (
    "id" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "gateway_path" TEXT NOT NULL,
    "downstream_url" TEXT NOT NULL,
    "method" "GatewayRouteMethod" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "require_api_key" BOOLEAN NOT NULL DEFAULT false,
    "require_jwt" BOOLEAN NOT NULL DEFAULT false,
    "timeout_enabled" BOOLEAN NOT NULL DEFAULT true,
    "timeout_ms" INTEGER NOT NULL DEFAULT 3000,
    "cache_enabled" BOOLEAN NOT NULL DEFAULT false,
    "cache_ttl_seconds" INTEGER NOT NULL DEFAULT 30,
    "rate_limit_enabled" BOOLEAN NOT NULL DEFAULT false,
    "rate_limit_limit" INTEGER NOT NULL DEFAULT 100,
    "rate_limit_window_ms" INTEGER NOT NULL DEFAULT 60000,
    "request_transform_enabled" BOOLEAN NOT NULL DEFAULT false,
    "request_add_headers" JSONB,
    "request_remove_headers" JSONB,
    "response_transform_enabled" BOOLEAN NOT NULL DEFAULT false,
    "response_add_headers" JSONB,
    "response_remove_headers" JSONB,
    "retry_enabled" BOOLEAN NOT NULL DEFAULT false,
    "retry_attempts" INTEGER NOT NULL DEFAULT 0,
    "retry_on_statuses" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gateway_routes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gateway_routes_enabled_priority_idx" ON "gateway_routes"("enabled", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "gateway_routes_method_gateway_path_key" ON "gateway_routes"("method", "gateway_path");
