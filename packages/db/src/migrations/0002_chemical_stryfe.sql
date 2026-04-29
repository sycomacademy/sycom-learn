ALTER TABLE "auth"."organization" ADD COLUMN "primary_domain" text;--> statement-breakpoint
ALTER TABLE "auth"."organization" ADD COLUMN "support_email" text;--> statement-breakpoint
ALTER TABLE "auth"."organization" ADD COLUMN "internal_notes" text;