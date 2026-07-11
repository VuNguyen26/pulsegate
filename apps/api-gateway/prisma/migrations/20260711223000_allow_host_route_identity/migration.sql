-- Sprint 67 route identity includes request_host.
-- Remove both legacy method + gateway_path uniqueness variants so
-- path-only and exact-host routes may coexist on the same method/path.

ALTER TABLE "gateway_routes"
DROP CONSTRAINT IF EXISTS "gateway_routes_method_gateway_path_key";

ALTER TABLE "gateway_routes"
DROP CONSTRAINT IF EXISTS "gateway_routes_method_gateway_path_active_key";

DROP INDEX IF EXISTS "gateway_routes_method_gateway_path_key";

DROP INDEX IF EXISTS "gateway_routes_method_gateway_path_active_key";