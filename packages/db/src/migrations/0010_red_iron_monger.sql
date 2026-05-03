CREATE TABLE "certificate" (
	"id" text PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL,
	"course_id" text NOT NULL,
	"user_id" text NOT NULL,
	"certificate_number" text NOT NULL,
	"issued_at" timestamp NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "certificate_certificate_number_unique" UNIQUE("certificate_number")
);
--> statement-breakpoint
CREATE TABLE "enrollment" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"last_activity_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"attempt_number" integer NOT NULL,
	"score" integer NOT NULL,
	"max_score" integer NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"answers" jsonb NOT NULL,
	"submitted_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"last_viewed_at" timestamp,
	"best_score" integer,
	"latest_score" integer,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson" ADD COLUMN "open_at" timestamp;--> statement-breakpoint
ALTER TABLE "lesson" ADD COLUMN "due_at" timestamp;--> statement-breakpoint
UPDATE "lesson" SET "type" = 'quiz' WHERE "type" = 'test';--> statement-breakpoint
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_enrollment_id_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_attempt" ADD CONSTRAINT "lesson_attempt_enrollment_id_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_attempt" ADD CONSTRAINT "lesson_attempt_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollment_id_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "certificate_enrollment_id_idx" ON "certificate" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "certificate_course_id_idx" ON "certificate" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "certificate_user_id_idx" ON "certificate" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "certificate_enrollment_uidx" ON "certificate" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "enrollment_course_id_idx" ON "enrollment" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "enrollment_user_id_idx" ON "enrollment" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollment_course_user_uidx" ON "enrollment" USING btree ("course_id","user_id");--> statement-breakpoint
CREATE INDEX "lesson_attempt_enrollment_id_idx" ON "lesson_attempt" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "lesson_attempt_lesson_id_idx" ON "lesson_attempt" USING btree ("lesson_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_attempt_enrollment_lesson_attempt_uidx" ON "lesson_attempt" USING btree ("enrollment_id","lesson_id","attempt_number");--> statement-breakpoint
CREATE INDEX "lesson_progress_enrollment_id_idx" ON "lesson_progress" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "lesson_progress_lesson_id_idx" ON "lesson_progress" USING btree ("lesson_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_progress_enrollment_lesson_uidx" ON "lesson_progress" USING btree ("enrollment_id","lesson_id");
