CREATE TABLE "invite_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"token_prefix" text NOT NULL,
	"role" "org_member_role" NOT NULL,
	"note" text,
	"created_by_user_id" uuid,
	"used_by_user_id" uuid,
	"used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invite_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_used_by_user_id_users_id_fk" FOREIGN KEY ("used_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;