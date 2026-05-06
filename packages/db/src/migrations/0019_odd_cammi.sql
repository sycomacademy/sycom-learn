CREATE TABLE "course_ai_generation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text,
	"prompt" text NOT NULL,
	"model" text NOT NULL,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"status" text NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_ai_generation" ADD CONSTRAINT "course_ai_generation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_ai_generation" ADD CONSTRAINT "course_ai_generation_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_ai_generation_user_created_idx" ON "course_ai_generation" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "course_ai_generation_user_status_idx" ON "course_ai_generation" USING btree ("user_id","status");