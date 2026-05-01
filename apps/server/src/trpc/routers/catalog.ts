import {
  addCourseInstructor,
  createCategory,
  createCourse,
  deleteCategory,
  deleteCourse,
  getCourseById,
  listCategories,
  listCourses,
  recordApplicationAuditEvent,
  removeCourseInstructor,
  seedCourseToOrganizations,
  setCourseCategories,
  updateCategory,
  updateCourse,
} from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";

import { adminProcedure, router } from "../init";
import { auditRequestMeta } from "../lib/request-audit";
import { platformPermissionMiddleware } from "../middleware/permissions";
import {
  addAdminCourseInstructorSchema,
  createAdminCategorySchema,
  createAdminCourseSchema,
  deleteAdminCategorySchema,
  deleteAdminCourseSchema,
  getAdminCourseSchema,
  listAdminCategoriesSchema,
  listAdminCoursesSchema,
  removeAdminCourseInstructorSchema,
  seedAdminCourseSchema,
  setAdminCourseCategoriesSchema,
  updateAdminCategorySchema,
  updateAdminCourseSchema,
} from "../schemas";

function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: unknown }).code;
  if (code === "23505") return true;
  const message = (err as { message?: unknown }).message;
  return typeof message === "string" && message.includes("duplicate key");
}

export const catalogRouter = router({
  // ---- Courses ----
  list: adminProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(listAdminCoursesSchema)
    .query(async ({ ctx, input }) => {
      return await listCourses(ctx.db, { ...input, scope: "platform" });
    }),

  get: adminProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(getAdminCourseSchema)
    .query(async ({ ctx, input }) => {
      const detail = await getCourseById(ctx.db, input);
      if (!detail || detail.organizationId !== null) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      }
      return detail;
    }),

  create: adminProcedure
    .use(platformPermissionMiddleware({ course: ["create"] }))
    .input(createAdminCourseSchema)
    .mutation(async ({ ctx, input }) => {
      let courseRow: { id: string };
      try {
        courseRow = await createCourse(ctx.db, {
          scope: "platform",
          title: input.title,
          slug: input.slug,
          description: input.description,
          imageUrl: input.imageUrl,
          difficulty: input.difficulty,
          estimatedDuration: input.estimatedDuration,
          status: input.status,
          createdBy: ctx.session.user.id,
        });
      } catch (err) {
        if (isUniqueViolation(err)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A public course with this slug already exists",
          });
        }
        throw err;
      }

      if (input.instructorIds.length > 0) {
        for (const [index, userId] of input.instructorIds.entries()) {
          await addCourseInstructor(ctx.db, {
            courseId: courseRow.id,
            userId,
            role: index === 0 ? "main" : "secondary",
            addedBy: ctx.session.user.id,
          });
        }
      }
      if (input.categoryIds.length > 0) {
        await setCourseCategories(ctx.db, {
          courseId: courseRow.id,
          categoryIds: input.categoryIds,
        });
      }

      const { ip, userAgent } = auditRequestMeta(ctx);
      await recordApplicationAuditEvent(ctx.db, {
        event: "course_created",
        eventTitle: "Course created",
        eventSubtitle: `${input.title} was added to the public catalog`,
        actorId: ctx.session.user.id,
        actorType: "user",
        organizationId: null,
        ip,
        userAgent,
        metadata: {
          courseId: courseRow.id,
          courseTitle: input.title,
          courseSlug: input.slug,
          status: input.status,
          difficulty: input.difficulty,
          instructorIds: input.instructorIds,
          categoryIds: input.categoryIds,
        },
      });

      return { courseId: courseRow.id };
    }),

  update: adminProcedure
    .use(platformPermissionMiddleware({ course: ["update"] }))
    .input(updateAdminCourseSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await getCourseById(ctx.db, { courseId: input.courseId });
      if (!existing || existing.organizationId !== null) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      }

      try {
        await updateCourse(ctx.db, { courseId: input.courseId, patch: input.patch });
      } catch (err) {
        if (isUniqueViolation(err)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A public course with this slug already exists",
          });
        }
        throw err;
      }

      const { ip, userAgent } = auditRequestMeta(ctx);
      await recordApplicationAuditEvent(ctx.db, {
        event: "course_updated",
        eventTitle: "Course updated",
        eventSubtitle: `${existing.title} metadata was updated`,
        actorId: ctx.session.user.id,
        actorType: "user",
        organizationId: null,
        ip,
        userAgent,
        metadata: {
          courseId: input.courseId,
          courseTitle: existing.title,
          patch: input.patch,
        },
      });

      return { success: true };
    }),

  delete: adminProcedure
    .use(platformPermissionMiddleware({ course: ["delete"] }))
    .input(deleteAdminCourseSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await getCourseById(ctx.db, { courseId: input.courseId });
      if (!existing || existing.organizationId !== null) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      }

      await deleteCourse(ctx.db, input);

      const { ip, userAgent } = auditRequestMeta(ctx);
      await recordApplicationAuditEvent(ctx.db, {
        event: "course_deleted",
        eventTitle: "Course deleted",
        eventSubtitle: `${existing.title} was removed from the public catalog`,
        actorId: ctx.session.user.id,
        actorType: "user",
        organizationId: null,
        ip,
        userAgent,
        metadata: {
          courseId: input.courseId,
          courseTitle: existing.title,
          courseSlug: existing.slug,
          instructorNames: existing.instructors.map((i) => i.name),
          categoryNames: existing.categories.map((c) => c.name),
        },
      });

      return { success: true };
    }),

  seed: adminProcedure
    .use(platformPermissionMiddleware({ course: ["seed"] }))
    .input(seedAdminCourseSchema)
    .mutation(async ({ ctx, input }) => {
      const source = await getCourseById(ctx.db, { courseId: input.courseId });
      if (!source || source.organizationId !== null) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Source course not found" });
      }

      let results;
      try {
        results = await seedCourseToOrganizations(ctx.db, {
          sourceCourseId: input.courseId,
          organizationIds: input.organizationIds,
          seededByUserId: ctx.session.user.id,
        });
      } catch (err) {
        if (isUniqueViolation(err)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "One of the target organizations already has a course with this slug",
          });
        }
        throw err;
      }

      const { ip, userAgent } = auditRequestMeta(ctx);
      for (const result of results) {
        await recordApplicationAuditEvent(ctx.db, {
          event: "course_seeded_to_organization",
          eventTitle: "Course seeded",
          eventSubtitle: `${source.title} was seeded from the public catalog`,
          actorId: ctx.session.user.id,
          actorType: "user",
          organizationId: result.organizationId,
          ip,
          userAgent,
          metadata: {
            sourceCourseId: input.courseId,
            sourceCourseTitle: source.title,
            sourceCourseSlug: source.slug,
            newCourseId: result.newCourseId,
          },
        });
      }

      return { seeded: results };
    }),

  // ---- Instructors ----
  addInstructor: adminProcedure
    .use(platformPermissionMiddleware({ course: ["update"] }))
    .input(addAdminCourseInstructorSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await getCourseById(ctx.db, { courseId: input.courseId });
      if (!existing || existing.organizationId !== null) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      }

      await addCourseInstructor(ctx.db, {
        courseId: input.courseId,
        userId: input.userId,
        role: input.role,
        addedBy: ctx.session.user.id,
      });

      const { ip, userAgent } = auditRequestMeta(ctx);
      await recordApplicationAuditEvent(ctx.db, {
        event: "course_instructor_added",
        eventTitle: "Course instructor added",
        eventSubtitle: `Instructor added to ${existing.title}`,
        actorId: ctx.session.user.id,
        actorType: "user",
        organizationId: null,
        ip,
        userAgent,
        metadata: {
          courseId: input.courseId,
          courseTitle: existing.title,
          instructorUserId: input.userId,
          role: input.role,
        },
      });

      return { success: true };
    }),

  removeInstructor: adminProcedure
    .use(platformPermissionMiddleware({ course: ["update"] }))
    .input(removeAdminCourseInstructorSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await getCourseById(ctx.db, { courseId: input.courseId });
      if (!existing || existing.organizationId !== null) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      }

      await removeCourseInstructor(ctx.db, input);

      const { ip, userAgent } = auditRequestMeta(ctx);
      await recordApplicationAuditEvent(ctx.db, {
        event: "course_instructor_removed",
        eventTitle: "Course instructor removed",
        eventSubtitle: `Instructor removed from ${existing.title}`,
        actorId: ctx.session.user.id,
        actorType: "user",
        organizationId: null,
        ip,
        userAgent,
        metadata: {
          courseId: input.courseId,
          courseTitle: existing.title,
          instructorUserId: input.userId,
        },
      });

      return { success: true };
    }),

  setCategories: adminProcedure
    .use(platformPermissionMiddleware({ course: ["update"] }))
    .input(setAdminCourseCategoriesSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await getCourseById(ctx.db, { courseId: input.courseId });
      if (!existing || existing.organizationId !== null) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      }

      await setCourseCategories(ctx.db, input);
      return { success: true };
    }),

  // ---- Categories ----
  listCategories: adminProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(listAdminCategoriesSchema)
    .query(async ({ ctx, input }) => {
      return await listCategories(ctx.db, input);
    }),

  createCategory: adminProcedure
    .use(platformPermissionMiddleware({ course: ["update"] }))
    .input(createAdminCategorySchema)
    .mutation(async ({ ctx, input }) => {
      let row: { id: string };
      try {
        row = await createCategory(ctx.db, input);
      } catch (err) {
        if (isUniqueViolation(err)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A category with this slug already exists",
          });
        }
        throw err;
      }

      const { ip, userAgent } = auditRequestMeta(ctx);
      await recordApplicationAuditEvent(ctx.db, {
        event: "category_created",
        eventTitle: "Category created",
        eventSubtitle: `${input.name} was added to the catalog taxonomy`,
        actorId: ctx.session.user.id,
        actorType: "user",
        organizationId: null,
        ip,
        userAgent,
        metadata: { categoryId: row.id, categoryName: input.name, categorySlug: input.slug },
      });

      return { categoryId: row.id };
    }),

  updateCategory: adminProcedure
    .use(platformPermissionMiddleware({ course: ["update"] }))
    .input(updateAdminCategorySchema)
    .mutation(async ({ ctx, input }) => {
      try {
        await updateCategory(ctx.db, input);
      } catch (err) {
        if (isUniqueViolation(err)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A category with this slug already exists",
          });
        }
        throw err;
      }

      const { ip, userAgent } = auditRequestMeta(ctx);
      await recordApplicationAuditEvent(ctx.db, {
        event: "category_updated",
        eventTitle: "Category updated",
        eventSubtitle: `Category metadata changed`,
        actorId: ctx.session.user.id,
        actorType: "user",
        organizationId: null,
        ip,
        userAgent,
        metadata: { categoryId: input.categoryId, patch: input.patch },
      });

      return { success: true };
    }),

  deleteCategory: adminProcedure
    .use(platformPermissionMiddleware({ course: ["update"] }))
    .input(deleteAdminCategorySchema)
    .mutation(async ({ ctx, input }) => {
      await deleteCategory(ctx.db, input);

      const { ip, userAgent } = auditRequestMeta(ctx);
      await recordApplicationAuditEvent(ctx.db, {
        event: "category_deleted",
        eventTitle: "Category deleted",
        eventSubtitle: `Category was removed from the taxonomy`,
        actorId: ctx.session.user.id,
        actorType: "user",
        organizationId: null,
        ip,
        userAgent,
        metadata: { categoryId: input.categoryId },
      });

      return { success: true };
    }),
});
