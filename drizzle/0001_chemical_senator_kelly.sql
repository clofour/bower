CREATE TYPE "public"."webhook_deploy_mode" AS ENUM('any_push', 'tag', 'digest');--> statement-breakpoint
CREATE TYPE "public"."webhook_provider" AS ENUM('generic', 'docker_hub', 'ghcr');--> statement-breakpoint
CREATE TABLE "deployment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deployment_id" uuid NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deployments" ADD COLUMN "job_spec" jsonb;--> statement-breakpoint
ALTER TABLE "deployments" ADD COLUMN "previous_job_spec" jsonb;--> statement-breakpoint
ALTER TABLE "deployments" ADD COLUMN "trellis_job_name" text;--> statement-breakpoint
ALTER TABLE "environments" ADD COLUMN "resource_tier" "resource_tier" DEFAULT 'small' NOT NULL;--> statement-breakpoint
ALTER TABLE "environments" ADD COLUMN "env_vars" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "managed_proxies" ADD COLUMN "config_hash" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "owning_team_id" uuid;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "response_headers" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "redirects" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "tls_cert_secret" text;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "tls_key_secret" text;--> statement-breakpoint
ALTER TABLE "service_configs" ADD COLUMN "health_check_command" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "service_configs" ADD COLUMN "health_check_interval" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_configs" ADD COLUMN "health_check_timeout" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_configs" ADD COLUMN "health_check_threshold" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_configs" ADD COLUMN "volumes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "service_configs" ADD COLUMN "secret_bindings" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "service_configs" ADD COLUMN "raw_config" jsonb;--> statement-breakpoint
ALTER TABLE "service_configs" ADD COLUMN "cron_schedule" text;--> statement-breakpoint
ALTER TABLE "service_configs" ADD COLUMN "paused_replicas" integer;--> statement-breakpoint
ALTER TABLE "service_configs" ADD COLUMN "active_job_name" text;--> statement-breakpoint
ALTER TABLE "service_configs" ADD COLUMN "auto_rollback_seconds" integer DEFAULT 300 NOT NULL;--> statement-breakpoint
ALTER TABLE "service_configs" ADD COLUMN "canary_steps" jsonb DEFAULT '[10,25,50,100]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ADD COLUMN "token_prefix" text;--> statement-breakpoint
UPDATE "webhook_endpoints" SET "token_prefix" = substring("token_hash" from 1 for 8) WHERE "token_prefix" IS NULL;--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ALTER COLUMN "token_prefix" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ADD COLUMN "provider" "webhook_provider" DEFAULT 'generic' NOT NULL;--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ADD COLUMN "deploy_mode" "webhook_deploy_mode" DEFAULT 'any_push' NOT NULL;--> statement-breakpoint
ALTER TABLE "deployment_events" ADD CONSTRAINT "deployment_events_deployment_id_deployments_id_fk" FOREIGN KEY ("deployment_id") REFERENCES "public"."deployments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deployment_events_deployment_created_idx" ON "deployment_events" USING btree ("deployment_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "routes_environment_domain_path_idx" ON "routes" USING btree ("environment_id","domain","path_prefix");--> statement-breakpoint
CREATE UNIQUE INDEX "shared_secret_members_group_secret_idx" ON "shared_secret_members" USING btree ("group_id","secret_metadata_id");
