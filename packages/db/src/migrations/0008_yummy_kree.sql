CREATE TABLE "category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "course" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"source_course_id" text,
	"title" text NOT NULL,
	"description" text,
	"summary" jsonb,
	"slug" text NOT NULL,
	"image_url" text,
	"difficulty" text DEFAULT 'beginner' NOT NULL,
	"estimated_duration" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_category" (
	"course_id" text NOT NULL,
	"category_id" text NOT NULL,
	CONSTRAINT "course_category_course_id_category_id_pk" PRIMARY KEY("course_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "course_instructor" (
	"course_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'secondary' NOT NULL,
	"added_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_instructor_course_id_user_id_pk" PRIMARY KEY("course_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "lesson" (
	"id" text PRIMARY KEY NOT NULL,
	"section_id" text NOT NULL,
	"title" text NOT NULL,
	"content" jsonb,
	"type" text DEFAULT 'article' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"estimated_duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "section" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "auth"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_source_course_id_course_id_fk" FOREIGN KEY ("source_course_id") REFERENCES "public"."course"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_category" ADD CONSTRAINT "course_category_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_category" ADD CONSTRAINT "course_category_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_instructor" ADD CONSTRAINT "course_instructor_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_instructor" ADD CONSTRAINT "course_instructor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_instructor" ADD CONSTRAINT "course_instructor_added_by_user_id_fk" FOREIGN KEY ("added_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_section_id_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."section"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section" ADD CONSTRAINT "section_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_status_idx" ON "course" USING btree ("status");--> statement-breakpoint
CREATE INDEX "course_organization_id_idx" ON "course" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "course_created_by_idx" ON "course" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "course_source_course_id_idx" ON "course" USING btree ("source_course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_org_slug_uidx" ON "course" USING btree ("organization_id","slug") WHERE "course"."organization_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "course_platform_slug_uidx" ON "course" USING btree ("slug") WHERE "course"."organization_id" IS NULL;--> statement-breakpoint
CREATE INDEX "course_category_category_id_idx" ON "course_category" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "lesson_section_id_idx" ON "lesson" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "section_course_id_idx" ON "section" USING btree ("course_id");