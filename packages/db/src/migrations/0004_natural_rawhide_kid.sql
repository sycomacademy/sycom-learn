CREATE TYPE "public"."image_for" AS ENUM('user_avatar', 'course_thumbnail', 'lesson_artifact', 'organization_logo');--> statement-breakpoint
CREATE TABLE "storage" (
	"id" text PRIMARY KEY NOT NULL,
	"public_id" text NOT NULL,
	"name" text,
	"format" text NOT NULL,
	"bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"image_for" "image_for" NOT NULL,
	"entity_id" text NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "storage" ADD CONSTRAINT "storage_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "storage_publicId_uidx" ON "storage" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "storage_for_entity_idx" ON "storage" USING btree ("image_for","entity_id");--> statement-breakpoint
CREATE INDEX "storage_uploadedBy_idx" ON "storage" USING btree ("uploaded_by");