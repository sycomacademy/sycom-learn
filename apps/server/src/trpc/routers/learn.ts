import {
  checkLessonAnswer,
  getCourseById,
  getCourseCurriculumOutline,
  getEnrollmentForUserCourse,
  getEnrollmentProgressSummary,
  getLessonWithCourseId,
  getOrganizationOwnerEmail,
  getSectionById,
  type CourseDetail,
  type CurriculumSectionOutline,
  type EnrollmentProgressSummary,
} from "@sycom/db/queries/index";
import { stripQuestionAnswersFromContent } from "@sycom/db/queries/lesson";
import { contacts } from "@sycom/ui/lib/constants";
import { TRPCError } from "@trpc/server";

import { protectedProcedure, router } from "../init";
import { canReadCatalogCourse } from "../lib/public-course-access";
import { platformPermissionMiddleware } from "../middleware/permissions";
import {
  learnCheckAnswerOutputSchema,
  learnCheckAnswerSchema,
  learnGetLessonOutputSchema,
  learnGetLessonSchema,
  learnGetPlayerContextSchema,
  learnPlayerContextOutputSchema,
} from "../schemas";

const SUPPORT_EMAIL = contacts.support.email.contact;

function courseCatalogAccessPick(detail: CourseDetail) {
  return {
    organizationId: detail.organizationId,
    createdBy: detail.createdBy,
    instructors: detail.instructors,
  };
}

async function resolveLearnerContactEmail(
  database: Parameters<typeof getOrganizationOwnerEmail>[0],
  detail: Pick<CourseDetail, "organizationId">,
): Promise<string> {
  if (detail.organizationId) {
    const ownerEmail = await getOrganizationOwnerEmail(database, detail.organizationId);
    return ownerEmail ?? SUPPORT_EMAIL;
  }
  return SUPPORT_EMAIL;
}

function mergeOutlineWithProgress(
  outline: CurriculumSectionOutline[],
  summaryLessons: EnrollmentProgressSummary["lessons"],
) {
  const byId = new Map(summaryLessons.map((l) => [l.lessonId, l.status]));
  return outline.map((sec) => ({
    ...sec,
    lessons: sec.lessons.map((les) => ({
      ...les,
      progressStatus: byId.get(les.id) ?? "not_started",
    })),
  }));
}

function nextLessonIdFromSummary(lessons: EnrollmentProgressSummary["lessons"]): string | null {
  if (lessons.length === 0) return null;
  const incomplete = lessons.find((l) => l.status !== "completed");
  return incomplete?.lessonId ?? lessons[0]?.lessonId ?? null;
}

export const learnRouter = router({
  getPlayerContext: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(learnGetPlayerContextSchema)
    .output(learnPlayerContextOutputSchema)
    .query(async ({ ctx, input }) => {
      const detail = await getCourseById(ctx.db, { courseId: input.courseId });
      if (!detail || detail.status !== "published") {
        return { status: "course_not_found" as const };
      }

      const accessPick = courseCatalogAccessPick(detail);
      const contactEmail = await resolveLearnerContactEmail(ctx.db, detail);
      const isPlatformCourse = detail.organizationId === null;

      if (!canReadCatalogCourse(ctx.session, accessPick)) {
        return {
          status: "catalog_forbidden" as const,
          contactEmail,
          isPlatformCourse,
        };
      }

      const enrollmentRow = await getEnrollmentForUserCourse(ctx.db, {
        courseId: input.courseId,
        userId: ctx.session.user.id,
      });
      if (!enrollmentRow) {
        return {
          status: "not_enrolled" as const,
          contactEmail,
          isPlatformCourse,
        };
      }

      const summary = await getEnrollmentProgressSummary(ctx.db, {
        courseId: input.courseId,
        userId: ctx.session.user.id,
      });
      if (!summary) {
        return {
          status: "not_enrolled" as const,
          contactEmail,
          isPlatformCourse,
        };
      }

      const outline = await getCourseCurriculumOutline(ctx.db, {
        courseId: input.courseId,
      });
      const sections = mergeOutlineWithProgress(outline, summary.lessons);

      const totalLessonCount = summary.lessons.length;
      const completedLessonCount = summary.lessons.filter((l) => l.status === "completed").length;
      const progressPercent =
        totalLessonCount > 0 ? Math.round((completedLessonCount / totalLessonCount) * 100) : 0;

      return {
        status: "ok" as const,
        courseId: detail.id,
        courseTitle: detail.title,
        completedLessonCount,
        totalLessonCount,
        progressPercent,
        nextLessonId: nextLessonIdFromSummary(summary.lessons),
        sections,
      };
    }),

  getLesson: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(learnGetLessonSchema)
    .output(learnGetLessonOutputSchema)
    .query(async ({ ctx, input }) => {
      const row = await getLessonWithCourseId(ctx.db, input.lessonId);
      if (!row || row.courseId !== input.courseId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
      }

      const detail = await getCourseById(ctx.db, { courseId: input.courseId });
      if (!detail || detail.status !== "published") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      }

      if (!canReadCatalogCourse(ctx.session, courseCatalogAccessPick(detail))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to access this course",
        });
      }

      const enrollmentRow = await getEnrollmentForUserCourse(ctx.db, {
        courseId: input.courseId,
        userId: ctx.session.user.id,
      });
      if (!enrollmentRow) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not enrolled in this course" });
      }

      const sectionRow = await getSectionById(ctx.db, { sectionId: row.sectionId });
      const sectionTitle = sectionRow?.title ?? "";

      return {
        id: row.id,
        sectionId: row.sectionId,
        courseId: row.courseId,
        title: row.title,
        type: row.type,
        openAt: row.openAt,
        dueAt: row.dueAt,
        order: row.order,
        content: stripQuestionAnswersFromContent(row.content),
        sectionTitle,
      };
    }),

  checkAnswer: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(learnCheckAnswerSchema)
    .output(learnCheckAnswerOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const row = await getLessonWithCourseId(ctx.db, input.lessonId);
      if (!row || row.courseId !== input.courseId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
      }

      const detail = await getCourseById(ctx.db, { courseId: input.courseId });
      if (!detail || detail.status !== "published") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      }

      if (!canReadCatalogCourse(ctx.session, courseCatalogAccessPick(detail))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to access this course",
        });
      }

      const enrollmentRow = await getEnrollmentForUserCourse(ctx.db, {
        courseId: input.courseId,
        userId: ctx.session.user.id,
      });
      if (!enrollmentRow) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not enrolled in this course" });
      }

      return await checkLessonAnswer(ctx.db, {
        lessonId: input.lessonId,
        questionId: input.questionId,
        selected: input.selected,
      });
    }),
});
