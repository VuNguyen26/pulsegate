ALTER TABLE "gateway_routes"
ADD COLUMN "created_by" TEXT,
ADD COLUMN "updated_by" TEXT,
ADD COLUMN "deleted_at" TIMESTAMP(3),
ADD COLUMN "deleted_by" TEXT;

DROP INDEX IF EXISTS "gateway_routes_method_gateway_path_key";

CREATE UNIQUE INDEX "gateway_routes_method_gateway_path_active_key"
ON "gateway_routes"("method", "gateway_path")
WHERE "deleted_at" IS NULL;

CREATE INDEX "gateway_routes_deleted_at_idx"
ON "gateway_routes"("deleted_at");

CREATE INDEX "gateway_routes_enabled_deleted_at_priority_idx"
ON "gateway_routes"("enabled", "deleted_at", "priority");