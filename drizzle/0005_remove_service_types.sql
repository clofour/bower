ALTER TABLE "services" DROP COLUMN IF EXISTS "type";--> statement-breakpoint
DROP TABLE IF EXISTS "service_templates";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."service_type";
