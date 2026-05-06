CREATE TYPE "public"."enrollment_access_source" AS ENUM('paid', 'org_grant', 'admin_grant', 'free');--> statement-breakpoint
ALTER TABLE "enrollment" ADD COLUMN "access_source" "enrollment_access_source" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "enrollment" ADD COLUMN "granted_by_user_id" text;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_granted_by_user_id_user_id_fk" FOREIGN KEY ("granted_by_user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;