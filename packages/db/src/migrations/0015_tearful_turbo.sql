ALTER TABLE "lesson_attempt" ADD COLUMN "integrity_events" jsonb;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD COLUMN "exam_integrity_events" jsonb;