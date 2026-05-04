import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import { createdAt, updatedAt } from "./_shared";
import { organization, user } from "./auth";

// ---------------------------------------------------------------------------
// Enums (inline text enums)
// ---------------------------------------------------------------------------

export const COURSE_STATUSES = ["draft", "published"] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const INSTRUCTOR_ROLES = ["main", "secondary"] as const;
export type InstructorRole = (typeof INSTRUCTOR_ROLES)[number];

export const LESSON_TYPES = ["article", "quiz", "exam"] as const;
export type LessonType = (typeof LESSON_TYPES)[number];

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------
// Dual-scope: organizationId IS NULL means a public/platform-owned course;
// non-null means an organization-owned course. Platform admin can "seed" a
// public course into an org, which inserts an independent copy with
// sourceCourseId pointing back to the original (purely for provenance —
// updates do not propagate).

export const course = pgTable(
  "course",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => `crs_${crypto.randomUUID()}`),
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "cascade",
    }),
    sourceCourseId: text("source_course_id").references((): AnyPgColumn => course.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    summary: jsonb("summary"),
    slug: text("slug").notNull(),
    imageUrl: text("image_url"),
    difficulty: text("difficulty", { enum: DIFFICULTY_LEVELS }).default("beginner").notNull(),
    estimatedDuration: integer("estimated_duration"),
    status: text("status", { enum: COURSE_STATUSES }).default("draft").notNull(),
    /** Per-course PDF template + copy (keywords). Nullable: UI applies package defaults until set. */
    certificateSettings: jsonb("certificate_settings"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("course_status_idx").on(table.status),
    index("course_organization_id_idx").on(table.organizationId),
    index("course_created_by_idx").on(table.createdBy),
    index("course_source_course_id_idx").on(table.sourceCourseId),
    // Slug uniqueness scoped per scope: one unique index for org courses,
    // one for platform courses. Together they enforce that (org_id, slug)
    // is unique even when org_id is NULL — drizzle-orm 0.45 doesn't expose
    // `nullsNotDistinct()` on the IndexBuilder, so we use partial indexes.
    uniqueIndex("course_org_slug_uidx")
      .on(table.organizationId, table.slug)
      .where(sql`${table.organizationId} IS NOT NULL`),
    uniqueIndex("course_platform_slug_uidx")
      .on(table.slug)
      .where(sql`${table.organizationId} IS NULL`),
  ],
);

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const category = pgTable("category", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => `cat_${crypto.randomUUID()}`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  order: integer("order").default(0).notNull(),
});

export const courseCategory = pgTable(
  "course_category",
  {
    courseId: text("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.courseId, table.categoryId] }),
    index("course_category_category_id_idx").on(table.categoryId),
  ],
);

// ---------------------------------------------------------------------------
// Course instructors
// ---------------------------------------------------------------------------

export const courseInstructor = pgTable(
  "course_instructor",
  {
    courseId: text("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role", { enum: INSTRUCTOR_ROLES }).notNull().default("secondary"),
    addedBy: text("added_by").references(() => user.id, { onDelete: "set null" }),
    createdAt,
  },
  (table) => [primaryKey({ columns: [table.courseId, table.userId] })],
);

// ---------------------------------------------------------------------------
// Sections (groups of lessons within a course)
// ---------------------------------------------------------------------------

export const section = pgTable(
  "section",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => `sec_${crypto.randomUUID()}`),
    courseId: text("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    openAt: timestamp("open_at", { withTimezone: true }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    order: integer("order").notNull().default(0),
    createdAt,
    updatedAt,
  },
  (table) => [index("section_course_id_idx").on(table.courseId)],
);

// ---------------------------------------------------------------------------
// Lessons (smallest learning unit — content authored next sprint)
// ---------------------------------------------------------------------------

export const lesson = pgTable(
  "lesson",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => `lsn_${crypto.randomUUID()}`),
    sectionId: text("section_id")
      .notNull()
      .references(() => section.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: jsonb("content"),
    type: text("type", { enum: LESSON_TYPES }).default("article").notNull(),
    openAt: timestamp("open_at", { withTimezone: true }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    order: integer("order").notNull().default(0),
    estimatedDuration: integer("estimated_duration"),
    createdAt,
    updatedAt,
  },
  (table) => [index("lesson_section_id_idx").on(table.sectionId)],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const courseRelations = relations(course, ({ one, many }) => ({
  organization: one(organization, {
    fields: [course.organizationId],
    references: [organization.id],
  }),
  creator: one(user, {
    fields: [course.createdBy],
    references: [user.id],
  }),
  instructors: many(courseInstructor),
  sections: many(section),
  categories: many(courseCategory),
}));

export const courseInstructorRelations = relations(courseInstructor, ({ one }) => ({
  course: one(course, {
    fields: [courseInstructor.courseId],
    references: [course.id],
  }),
  user: one(user, {
    fields: [courseInstructor.userId],
    references: [user.id],
    relationName: "course_instructor_user",
  }),
  addedByUser: one(user, {
    fields: [courseInstructor.addedBy],
    references: [user.id],
    relationName: "course_instructor_added_by",
  }),
}));

export const sectionRelations = relations(section, ({ one, many }) => ({
  course: one(course, {
    fields: [section.courseId],
    references: [course.id],
  }),
  lessons: many(lesson),
}));

export const lessonRelations = relations(lesson, ({ one }) => ({
  section: one(section, {
    fields: [lesson.sectionId],
    references: [section.id],
  }),
}));

export const categoryRelations = relations(category, ({ many }) => ({
  courses: many(courseCategory),
}));

export const courseCategoryRelations = relations(courseCategory, ({ one }) => ({
  course: one(course, {
    fields: [courseCategory.courseId],
    references: [course.id],
  }),
  category: one(category, {
    fields: [courseCategory.categoryId],
    references: [category.id],
  }),
}));

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type Course = typeof course.$inferSelect;
export type NewCourse = typeof course.$inferInsert;

export type Section = typeof section.$inferSelect;
export type NewSection = typeof section.$inferInsert;

export type Lesson = typeof lesson.$inferSelect;
export type NewLesson = typeof lesson.$inferInsert;

export type Category = typeof category.$inferSelect;
export type NewCategory = typeof category.$inferInsert;

export type CourseInstructor = typeof courseInstructor.$inferSelect;
export type NewCourseInstructor = typeof courseInstructor.$inferInsert;

export type CourseCategory = typeof courseCategory.$inferSelect;
export type NewCourseCategory = typeof courseCategory.$inferInsert;
