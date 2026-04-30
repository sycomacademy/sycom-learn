ALTER TABLE "auth"."invitation" ADD COLUMN "token_hash" text;--> statement-breakpoint
ALTER TABLE "auth"."invitation" ADD COLUMN "invitee_name" text;--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_token_hash_uidx" ON "auth"."invitation" USING btree ("token_hash");