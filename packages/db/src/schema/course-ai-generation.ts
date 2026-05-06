import { relations } from "drizzle-orm";
import { index, integer, pgTable, text } from "drizzle-orm/pg-core";

import { createdAt } from "./_shared";
import { user } from "./auth";
import { course } from "./course";

export const COURSE_AI_GENERATION_STATUSES = ["pending", "success", "failed"] as const;
export type CourseAiGenerationStatus = (typeof COURSE_AI_GENERATION_STATUSES)[number];

export const courseAiGeneration = pgTable(
  "course_ai_generation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => `cag_${crypto.randomUUID()}`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: text("course_id").references(() => course.id, { onDelete: "set null" }),
    /** Serialized prompt / options for audit (e.g. JSON of GenerateCourseWithAIInput). */
    prompt: text("prompt").notNull(),
    model: text("model").notNull(),
    promptTokens: integer("prompt_tokens"),
    completionTokens: integer("completion_tokens"),
    status: text("status", { enum: COURSE_AI_GENERATION_STATUSES }).notNull(),
    errorMessage: text("error_message"),
    createdAt,
  },
  (t) => [
    index("course_ai_generation_user_created_idx").on(t.userId, t.createdAt),
    index("course_ai_generation_user_status_idx").on(t.userId, t.status),
  ],
);

export const courseAiGenerationRelations = relations(courseAiGeneration, ({ one }) => ({
  user: one(user, {
    fields: [courseAiGeneration.userId],
    references: [user.id],
  }),
  course: one(course, {
    fields: [courseAiGeneration.courseId],
    references: [course.id],
  }),
}));

export type CourseAiGeneration = typeof courseAiGeneration.$inferSelect;
export type NewCourseAiGeneration = typeof courseAiGeneration.$inferInsert;
