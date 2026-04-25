CREATE TYPE "public"."image_for" AS ENUM('avatar', 'course_thumbnail', 'lesson_video', 'cohort_logo', 'organization_logo');--> statement-breakpoint
CREATE TABLE "image" (
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
ALTER TABLE "image" ADD CONSTRAINT "image_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "image_publicId_uidx" ON "image" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "image_for_entity_idx" ON "image" USING btree ("image_for","entity_id");--> statement-breakpoint
CREATE INDEX "image_uploadedBy_idx" ON "image" USING btree ("uploaded_by");