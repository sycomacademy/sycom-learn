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

import type { Context } from "../context";
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

type LessonWithProgress = CurriculumSectionOutline["lessons"][number] & {
  progressStatus: EnrollmentProgressSummary["lessons"][number]["status"];
};

type SectionWithProgress = Omit<CurriculumSectionOutline, "lessons"> & {
  lessons: LessonWithProgress[];
};

function mergeOutlineWithProgress(
  outline: CurriculumSectionOutline[],
  summaryLessons: EnrollmentProgressSummary["lessons"],
): SectionWithProgress[] {
  const byId = new Map(summaryLessons.map((l) => [l.lessonId, l.status]));
  return outline.map((sec) => ({
    ...sec,
    lessons: sec.lessons.map((les) => ({
      ...les,
      progressStatus: byId.get(les.id) ?? "not_started",
    })),
  }));
}

type LessonWithLocks = LessonWithProgress & { locked: boolean; lockReason?: string };

type SectionWithLocks = Omit<SectionWithProgress, "lessons"> & { lessons: LessonWithLocks[] };

function applyLessonLocks(sections: SectionWithProgress[], now: Date): SectionWithLocks[] {
  type OrderRow = {
    lessonId: string;
    sectionOpenAt: Date | null;
    lessonOpenAt: Date | null;
    progressStatus: LessonWithProgress["progressStatus"];
  };

  const order: OrderRow[] = [];
  for (const sec of sections) {
    for (const l of sec.lessons) {
      order.push({
        lessonId: l.id,
        sectionOpenAt: sec.openAt,
        lessonOpenAt: l.openAt,
        progressStatus: l.progressStatus,
      });
    }
  }

  const lockById = new Map<string, { locked: boolean; lockReason?: string }>();

  for (let i = 0; i < order.length; i++) {
    const row = order[i];
    if (row === undefined) continue;
    let locked = false;
    let lockReason: string | undefined;

    if (row.sectionOpenAt && now < row.sectionOpenAt) {
      locked = true;
      lockReason = `This module opens on ${row.sectionOpenAt.toLocaleString()}.`;
    } else if (row.lessonOpenAt && now < row.lessonOpenAt) {
      locked = true;
      lockReason = `This lesson opens on ${row.lessonOpenAt.toLocaleString()}.`;
    } else if (i > 0) {
      const prev = order[i - 1];
      if (prev !== undefined && prev.progressStatus !== "completed") {
        locked = true;
        lockReason = "Finish earlier lessons before continuing.";
      }
    }

    lockById.set(row.lessonId, { locked, lockReason });
  }

  return sections.map((sec) => ({
    ...sec,
    lessons: sec.lessons.map((les) => {
      const meta = lockById.get(les.id) ?? { locked: false };
      return {
        ...les,
        locked: meta.locked,
        ...(meta.lockReason ? { lockReason: meta.lockReason } : {}),
      };
    }),
  }));
}

function nextPlayableLessonId(sections: SectionWithLocks[]): string | null {
  const flat = sections.flatMap((s) => s.lessons);
  const nextIncomplete = flat.find((l) => l.progressStatus !== "completed" && !l.locked);
  if (nextIncomplete) return nextIncomplete.id;
  const firstOpen = flat.find((l) => !l.locked);
  return firstOpen?.id ?? null;
}

async function getSectionsWithLocksForLearner(
  database: Context["db"],
  input: { courseId: string; userId: string },
): Promise<SectionWithLocks[] | null> {
  const summary = await getEnrollmentProgressSummary(database, {
    courseId: input.courseId,
    userId: input.userId,
  });
  if (!summary) return null;
  const outline = await getCourseCurriculumOutline(database, {
    courseId: input.courseId,
  });
  const merged = mergeOutlineWithProgress(outline, summary.lessons);
  return applyLessonLocks(merged, new Date());
}

async function assertLearnLessonUnlocked(
  database: Context["db"],
  input: { courseId: string; lessonId: string; userId: string },
) {
  const sections = await getSectionsWithLocksForLearner(database, {
    courseId: input.courseId,
    userId: input.userId,
  });
  if (!sections) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are not enrolled in this course" });
  }
  for (const sec of sections) {
    for (const les of sec.lessons) {
      if (les.id === input.lessonId) {
        if (les.locked) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: les.lockReason ?? "This lesson is locked.",
          });
        }
        return;
      }
    }
  }
  throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
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
      const merged = mergeOutlineWithProgress(outline, summary.lessons);
      const sections = applyLessonLocks(merged, new Date());

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
        nextLessonId: nextPlayableLessonId(sections),
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

      await assertLearnLessonUnlocked(ctx.db, {
        courseId: input.courseId,
        lessonId: input.lessonId,
        userId: ctx.session.user.id,
      });

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

      await assertLearnLessonUnlocked(ctx.db, {
        courseId: input.courseId,
        lessonId: input.lessonId,
        userId: ctx.session.user.id,
      });

      return await checkLessonAnswer(ctx.db, {
        lessonId: input.lessonId,
        questionId: input.questionId,
        selected: input.selected,
      });
    }),
});
