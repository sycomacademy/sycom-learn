CREATE TABLE "cohort_course" (
	"id" text PRIMARY KEY NOT NULL,
	"cohort_id" text NOT NULL,
	"course_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cohort_course" ADD CONSTRAINT "cohort_course_cohort_id_cohort_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "auth"."cohort"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_course" ADD CONSTRAINT "cohort_course_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cohort_course_cohort_id_idx" ON "cohort_course" USING btree ("cohort_id");--> statement-breakpoint
CREATE INDEX "cohort_course_course_id_idx" ON "cohort_course" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cohort_course_cohort_course_uidx" ON "cohort_course" USING btree ("cohort_id","course_id");