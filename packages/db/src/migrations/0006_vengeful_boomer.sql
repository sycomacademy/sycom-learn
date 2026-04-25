ALTER TABLE "storage" ALTER COLUMN "folder" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."storage_folder";--> statement-breakpoint
CREATE TYPE "public"."storage_folder" AS ENUM('user_avatars', 'course_thumbnails', 'lesson_artifacts', 'organization_logos');--> statement-breakpoint
ALTER TABLE "storage" ALTER COLUMN "folder" SET DATA TYPE "public"."storage_folder" USING "folder"::"public"."storage_folder";