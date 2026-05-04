import {
  createEnrollment,
  getCatalogCourseDetail,
  getEnrollmentProgressSummary,
  listCatalogCourses,
  listLessonRowsForCourseEstimation,
} from "@sycom/db/queries/index";
import type { CatalogCourseDetailRaw } from "@sycom/db/queries/catalog";
import { course } from "@sycom/db/schema/course";
import { certificate, enrollment } from "@sycom/db/schema/enrollment";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

import { renderIssuedCertificatePdfBuffer } from "../../lib/certificate-pdf-issue";
import { estimateLessonMinutes } from "../lib/duration";
import { assertCanReadCatalogCourse } from "../lib/public-course-access";
import { protectedProcedure, router } from "../init";
import { platformPermissionMiddleware } from "../middleware/permissions";
import {
  enrollInCatalogCourseSchema,
  getCatalogCourseSchema,
  listCatalogCoursesSchema,
} from "../schemas";

function catalogAccessDetailPick(detail: CatalogCourseDetailRaw) {
  return {
    organizationId: detail.organizationId,
    createdBy: detail.createdBy,
    instructors: detail.instructors,
  };
}

function catalogDetailForClient(raw: CatalogCourseDetailRaw) {
  let totalMinutes = 0;
  const sections = raw.sections.map((sec) => {
    let sectionMinutes = 0;
    const lessons = sec.lessons.map((l) => {
      const minutes = estimateLessonMinutes({ type: l.type, content: l.content });
      sectionMinutes += minutes;
      return {
        id: l.id,
        sectionId: l.sectionId,
        title: l.title,
        type: l.type,
        order: l.order,
        minutes,
      };
    });
    totalMinutes += sectionMinutes;
    return {
      id: sec.id,
      title: sec.title,
      description: sec.description,
      openAt: sec.openAt,
      dueAt: sec.dueAt,
      order: sec.order,
      totalMinutes: sectionMinutes,
      lessons,
    };
  });

  const {
    sections: _rawSections,
    enrollmentId,
    enrollmentStatus,
    certificateId,
    ...courseFields
  } = raw;

  return {
    ...courseFields,
    sections,
    totalMinutes,
    enrolled: enrollmentId != null,
    completed: enrollmentStatus === "completed",
    certificateId,
  };
}

export const catalogRouter = router({
  list: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["list"] }))
    .input(listCatalogCoursesSchema)
    .query(async ({ ctx, input }) => {
      const orgId = ctx.session.session.activeOrganizationId ?? null;
      const result = await listCatalogCourses(ctx.db, {
        ...input,
        scope: orgId ? "organization" : "platform",
        organizationId: orgId ?? undefined,
        userId: ctx.session.user.id,
      });

      const courseIds = result.rows.map((row) => row.id);
      const estimationRows = await listLessonRowsForCourseEstimation(ctx.db, courseIds);
      const minutesByCourse = new Map<string, number>();
      for (const row of estimationRows) {
        const m = estimateLessonMinutes({ type: row.type, content: row.content });
        minutesByCourse.set(row.courseId, (minutesByCourse.get(row.courseId) ?? 0) + m);
      }

      return {
        ...result,
        rows: result.rows.map((row) => ({
          ...row,
          totalMinutes: minutesByCourse.get(row.id) ?? 0,
        })),
      };
    }),

  get: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(getCatalogCourseSchema)
    .query(async ({ ctx, input }) => {
      const raw = await getCatalogCourseDetail(ctx.db, {
        courseId: input.courseId,
        userId: ctx.session.user.id,
      });
      if (!raw) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      }

      assertCanReadCatalogCourse(ctx.session, catalogAccessDetailPick(raw));
      return catalogDetailForClient(raw);
    }),

  enroll: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(enrollInCatalogCourseSchema)
    .mutation(async ({ ctx, input }) => {
      const raw = await getCatalogCourseDetail(ctx.db, {
        courseId: input.courseId,
        userId: ctx.session.user.id,
      });
      if (!raw) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      }

      assertCanReadCatalogCourse(ctx.session, catalogAccessDetailPick(raw));

      return createEnrollment(ctx.db, {
        courseId: input.courseId,
        userId: ctx.session.user.id,
      });
    }),

  getMyProgress: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(getCatalogCourseSchema)
    .query(async ({ ctx, input }) => {
      const raw = await getCatalogCourseDetail(ctx.db, {
        courseId: input.courseId,
        userId: ctx.session.user.id,
      });
      if (!raw) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      }

      assertCanReadCatalogCourse(ctx.session, catalogAccessDetailPick(raw));

      return getEnrollmentProgressSummary(ctx.db, {
        courseId: input.courseId,
        userId: ctx.session.user.id,
      });
    }),

  certificatePdf: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(getCatalogCourseSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const raw = await getCatalogCourseDetail(ctx.db, {
        courseId: input.courseId,
        userId,
      });
      if (!raw) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      }

      assertCanReadCatalogCourse(ctx.session, catalogAccessDetailPick(raw));

      if (raw.enrollmentStatus !== "completed" || !raw.certificateId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Certificate is not available for this course yet",
        });
      }

      const [row] = await ctx.db
        .select({
          certificateNumber: certificate.certificateNumber,
          issuedAt: certificate.issuedAt,
          courseTitle: course.title,
          certificateSettings: course.certificateSettings,
        })
        .from(certificate)
        .innerJoin(enrollment, eq(certificate.enrollmentId, enrollment.id))
        .innerJoin(course, eq(enrollment.courseId, course.id))
        .where(
          and(
            eq(certificate.id, raw.certificateId),
            eq(enrollment.userId, userId),
            eq(enrollment.courseId, input.courseId),
          ),
        )
        .limit(1);

      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Certificate not found" });
      }

      const recipientName = ctx.session.user.name?.trim() || ctx.session.user.email;
      const buffer = await renderIssuedCertificatePdfBuffer(row.certificateSettings, {
        recipientName,
        courseTitle: row.courseTitle,
        certificateNumber: row.certificateNumber,
        issuedAt: row.issuedAt,
      });

      return {
        base64: Buffer.from(buffer).toString("base64"),
        fileName: `certificate-${row.certificateNumber}.pdf`,
      };
    }),
});
