-- CreateEnum
CREATE TYPE "UsagePlanQuotaWindow" AS ENUM ('DAILY', 'MONTHLY');

-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "usage_plan_id" TEXT;

-- CreateTable
CREATE TABLE "usage_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quota_limit" INTEGER NOT NULL,
    "quota_window" "UsagePlanQuotaWindow" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "usage_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usage_plans_name_key" ON "usage_plans"("name");

-- CreateIndex
CREATE INDEX "usage_plans_enabled_idx" ON "usage_plans"("enabled");

-- CreateIndex
CREATE INDEX "usage_plans_quota_window_idx" ON "usage_plans"("quota_window");

-- CreateIndex
CREATE INDEX "usage_plans_created_at_idx" ON "usage_plans"("created_at");

-- CreateIndex
CREATE INDEX "api_keys_usage_plan_id_idx" ON "api_keys"("usage_plan_id");

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_usage_plan_id_fkey" FOREIGN KEY ("usage_plan_id") REFERENCES "usage_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
