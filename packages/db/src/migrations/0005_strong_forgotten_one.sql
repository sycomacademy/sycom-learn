CREATE TYPE "public"."storage_entity_type" AS ENUM('user', 'course', 'lesson', 'organization');--> statement-breakpoint
CREATE TYPE "public"."storage_folder" AS ENUM('avatars', 'course_thumbnails', 'lesson_artifacts', 'organization_logos');--> statement-breakpoint
CREATE TYPE "public"."storage_resource_type" AS ENUM('image', 'video', 'audio', 'file');--> statement-breakpoint
DROP INDEX "storage_publicId_uidx";--> statement-breakpoint
DROP INDEX "storage_for_entity_idx";--> statement-breakpoint
DROP INDEX "storage_uploadedBy_idx";--> statement-breakpoint
ALTER TABLE "storage" ADD COLUMN "secure_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "storage" ADD COLUMN "folder" "storage_folder" NOT NULL;--> statement-breakpoint
ALTER TABLE "storage" ADD COLUMN "resource_type" "storage_resource_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "storage" ADD COLUMN "entity_type" "storage_entity_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "storage" ADD COLUMN "tags" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "storage" ADD COLUMN "uploader_email" text;--> statement-breakpoint
CREATE UNIQUE INDEX "storage_public_id_uidx" ON "storage" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "storage_entity_idx" ON "storage" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "storage_folder_idx" ON "storage" USING btree ("folder");--> statement-breakpoint
CREATE INDEX "storage_uploaded_by_idx" ON "storage" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "storage_tags_gin_idx" ON "storage" USING gin ("tags");--> statement-breakpoint
ALTER TABLE "storage" DROP COLUMN "image_for";--> statement-breakpoint
DROP TYPE "public"."image_for";