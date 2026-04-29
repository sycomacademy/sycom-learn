CREATE TYPE "auth"."platform_invitation_status" AS ENUM('pending', 'accepted', 'rejected', 'revoked');--> statement-breakpoint
CREATE TABLE "auth"."platform_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" "auth"."platform_role" NOT NULL,
	"status" "auth"."platform_invitation_status" DEFAULT 'pending' NOT NULL,
	"token_hash" text NOT NULL,
	"inviter_name" text NOT NULL,
	"inviter_user_id" text,
	"accepted_user_id" text,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"rejected_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "auth"."platform_invitations" ADD CONSTRAINT "platform_invitations_inviter_user_id_user_id_fk" FOREIGN KEY ("inviter_user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."platform_invitations" ADD CONSTRAINT "platform_invitations_accepted_user_id_user_id_fk" FOREIGN KEY ("accepted_user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "platform_invitation_email_idx" ON "auth"."platform_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "platform_invitation_status_idx" ON "auth"."platform_invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "platform_invitation_inviterUserId_idx" ON "auth"."platform_invitations" USING btree ("inviter_user_id");