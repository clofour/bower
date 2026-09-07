ALTER TABLE "invite_tokens" RENAME TO "organization_tokens";--> statement-breakpoint
ALTER TABLE "organization_tokens" RENAME CONSTRAINT "invite_tokens_org_id_organizations_id_fk" TO "organization_tokens_org_id_organizations_id_fk";--> statement-breakpoint
ALTER TABLE "organization_tokens" RENAME CONSTRAINT "invite_tokens_created_by_user_id_users_id_fk" TO "organization_tokens_created_by_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "organization_tokens" RENAME CONSTRAINT "invite_tokens_used_by_user_id_users_id_fk" TO "organization_tokens_used_by_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "organization_tokens" RENAME CONSTRAINT "invite_tokens_token_hash_unique" TO "organization_tokens_token_hash_unique";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_instance_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE TABLE "instance_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"token_prefix" text NOT NULL,
	"note" text,
	"created_by_user_id" uuid,
	"used_by_user_id" uuid,
	"used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "instance_tokens_token_hash_unique" UNIQUE("token_hash")
);--> statement-breakpoint
ALTER TABLE "instance_tokens" ADD CONSTRAINT "instance_tokens_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instance_tokens" ADD CONSTRAINT "instance_tokens_used_by_user_id_users_id_fk" FOREIGN KEY ("used_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
