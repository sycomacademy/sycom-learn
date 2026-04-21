CREATE TABLE "profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"onboarded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "profile" ("user_id", "onboarded_at", "created_at", "updated_at")
SELECT "id", "onboarded_at", "created_at", "updated_at"
FROM "auth"."user";--> statement-breakpoint
ALTER TABLE "auth"."user" DROP COLUMN "onboarded_at";