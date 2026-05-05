import {
  appendExamIntegrityEvent,
  checkLessonAnswer,
  getCourseById,
  getCourseCurriculumOutline,
  getEnrollmentForUserCourse,
  getEnrollmentProgressSummary,
  getLearnerLessonAnswers,
  getLessonWithCourseId,
  getOrganizationOwnerEmail,
  getSectionById,
  recordLessonAnswerDraft,
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
  learnRecordExamIntegrityOutputSchema,
  learnRecordExamIntegritySchema,
} from "../schemas";

const SUPPORT_EMAIL = contacts.support.email.contact;

function courseAccessPick(detail: CourseDetail) {
  return {
    organizationId: detail.organizationId,
    createdBy: detail.createdBy,
    instructors: detail.instructors,
  };
}

async function resolveLearnerContactEmail(
  database: Context["db"],
  organizationId: string | null,
): Promise<string> {
  if (!organizationId) return SUPPORT_EMAIL;
  return (await getOrganizationOwnerEmail(database, organizationId)) ?? SUPPORT_EMAIL;
}

type LessonWithProgress = CurriculumSectionOutline["lessons"][number] & {
  progressStatus: EnrollmentProgressSummary["lessons"][number]["status"];
};

type LessonLock =
  | { kind: "scheduled_section"; opensAt: Date }
  | { kind: "scheduled_lesson"; opensAt: Date }
  | { kind: "deadline_section"; dueAt: Date }
  | { kind: "deadline_lesson"; dueAt: Date }
  | { kind: "progression" };

type LessonWithLocks = LessonWithProgress & { locked: boolean; lock?: LessonLock };

type SectionWithLocks = Omit<CurriculumSectionOutline, "lessons"> & { lessons: LessonWithLocks[] };

function buildSectionsWithLocks(
  outline: CurriculumSectionOutline[],
  summaryLessons: EnrollmentProgressSummary["lessons"],
  now: Date,
): SectionWithLocks[] {
  const statusById = new Map(summaryLessons.map((l) => [l.lessonId, l.status]));
  const flat: Array<
    LessonWithProgress & { sectionOpenAt: Date | null; sectionDueAt: Date | null }
  > = [];
  for (const sec of outline) {
    for (const l of sec.lessons) {
      flat.push({
        ...l,
        progressStatus: statusById.get(l.id) ?? "not_started",
        sectionOpenAt: sec.openAt,
        sectionDueAt: sec.dueAt,
      });
    }
  }

  const lockById = new Map<string, { locked: boolean; lock?: LessonLock }>();
  for (const [i, row] of flat.entries()) {
    const prev = i > 0 ? flat[i - 1] : undefined;
    let lock: LessonLock | undefined;
    if (row.sectionOpenAt && now < row.sectionOpenAt) {
      lock = { kind: "scheduled_section", opensAt: row.sectionOpenAt };
    } else if (row.openAt && now < row.openAt) {
      lock = { kind: "scheduled_lesson", opensAt: row.openAt };
    } else if (prev && prev.progressStatus !== "completed") {
      lock = { kind: "progression" };
    } else if (row.progressStatus !== "completed" && row.dueAt && now > row.dueAt) {
      lock = { kind: "deadline_lesson", dueAt: row.dueAt };
    } else if (row.progressStatus !== "completed" && row.sectionDueAt && now > row.sectionDueAt) {
      lock = { kind: "deadline_section", dueAt: row.sectionDueAt };
    }
    lockById.set(row.id, lock ? { locked: true, lock } : { locked: false });
  }

  return outline.map((sec) => ({
    ...sec,
    lessons: sec.lessons.map((les) => ({
      ...les,
      progressStatus: statusById.get(les.id) ?? "not_started",
      ...(lockById.get(les.id) ?? { locked: false }),
    })),
  }));
}

function nextPlayableLessonId(sections: SectionWithLocks[]): string | null {
  const flat = sections.flatMap((s) => s.lessons);
  return (
    flat.find((l) => l.progressStatus !== "completed" && !l.locked)?.id ??
    flat.find((l) => !l.locked)?.id ??
    null
  );
}

function lockMessage(lock: LessonLock | undefined): string {
  switch (lock?.kind) {
    case "scheduled_section":
      return "This module is not open yet.";
    case "scheduled_lesson":
      return "This lesson is not open yet.";
    case "deadline_section":
      return "This module is closed.";
    case "deadline_lesson":
      return "This lesson is closed.";
    case "progression":
      return "Finish earlier lessons before continuing.";
    default:
      return "This lesson is locked.";
  }
}

async function loadLearnerSections(
  database: Context["db"],
  input: { courseId: string; userId: string },
): Promise<{ sections: SectionWithLocks[]; summary: EnrollmentProgressSummary } | null> {
  const summary = await getEnrollmentProgressSummary(database, input);
  if (!summary) return null;
  const outline = await getCourseCurriculumOutline(database, { courseId: input.courseId });
  return { sections: buildSectionsWithLocks(outline, summary.lessons, new Date()), summary };
}

async function assertCourseReadable(
  database: Context["db"],
  session: Context["session"],
  courseId: string,
): Promise<CourseDetail> {
  const detail = await getCourseById(database, { courseId });
  if (!detail || detail.status !== "published") {
    throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
  }
  if (!canReadCatalogCourse(session, courseAccessPick(detail))) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not authorized to access this course",
    });
  }
  return detail;
}

async function assertLessonUnlocked(
  database: Context["db"],
  session: NonNullable<Context["session"]>,
  input: { courseId: string; lessonId: string },
) {
  await assertCourseReadable(database, session, input.courseId);
  const enrollmentRow = await getEnrollmentForUserCourse(database, {
    courseId: input.courseId,
    userId: session.user.id,
  });
  if (!enrollmentRow) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are not enrolled in this course" });
  }
  const loaded = await loadLearnerSections(database, {
    courseId: input.courseId,
    userId: session.user.id,
  });
  if (!loaded) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are not enrolled in this course" });
  }
  const lesson = loaded.sections.flatMap((s) => s.lessons).find((l) => l.id === input.lessonId);
  if (!lesson) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
  }
  if (lesson.locked) {
    throw new TRPCError({ code: "FORBIDDEN", message: lockMessage(lesson.lock) });
  }
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
      const contactEmail = await resolveLearnerContactEmail(ctx.db, detail.organizationId);
      const isPlatformCourse = detail.organizationId === null;

      if (!canReadCatalogCourse(ctx.session, courseAccessPick(detail))) {
        return { status: "catalog_forbidden" as const, contactEmail, isPlatformCourse };
      }

      const enrollmentRow = await getEnrollmentForUserCourse(ctx.db, {
        courseId: input.courseId,
        userId: ctx.session.user.id,
      });
      const loaded = enrollmentRow
        ? await loadLearnerSections(ctx.db, {
            courseId: input.courseId,
            userId: ctx.session.user.id,
          })
        : null;
      if (!loaded) {
        return { status: "not_enrolled" as const, contactEmail, isPlatformCourse };
      }

      const total = loaded.summary.lessons.length;
      const completed = loaded.summary.lessons.filter((l) => l.status === "completed").length;
      return {
        status: "ok" as const,
        courseId: detail.id,
        courseTitle: detail.title,
        completedLessonCount: completed,
        totalLessonCount: total,
        progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
        nextLessonId: nextPlayableLessonId(loaded.sections),
        sections: loaded.sections,
      };
    }),

  getLesson: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(learnGetLessonSchema)
    .output(learnGetLessonOutputSchema)
    .query(async ({ ctx, input }) => {
      await assertLessonUnlocked(ctx.db, ctx.session, input);
      const row = await getLessonWithCourseId(ctx.db, input.lessonId);
      if (!row || row.courseId !== input.courseId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
      }
      const [sectionRow, learnerAnswers] = await Promise.all([
        getSectionById(ctx.db, { sectionId: row.sectionId }),
        getLearnerLessonAnswers(ctx.db, {
          courseId: input.courseId,
          userId: ctx.session.user.id,
          lessonId: input.lessonId,
        }),
      ]);
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
        sectionTitle: sectionRow?.title ?? "",
        answers: learnerAnswers.answers,
        answersSource: learnerAnswers.source,
      };
    }),

  checkAnswer: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(learnCheckAnswerSchema)
    .output(learnCheckAnswerOutputSchema)
    .mutation(async ({ ctx, input }) => {
      await assertLessonUnlocked(ctx.db, ctx.session, input);
      const lessonRow = await getLessonWithCourseId(ctx.db, input.lessonId);
      if (!lessonRow || lessonRow.courseId !== input.courseId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
      }
      const result = await checkLessonAnswer(ctx.db, {
        lessonId: input.lessonId,
        questionId: input.questionId,
        selected: input.selected,
      });
      const isAssessment = lessonRow.type === "quiz" || lessonRow.type === "exam";
      if (isAssessment || result.isCorrect) {
        await recordLessonAnswerDraft(ctx.db, {
          courseId: input.courseId,
          userId: ctx.session.user.id,
          lessonId: input.lessonId,
          questionId: input.questionId,
          selected: input.selected,
          isCorrect: result.isCorrect,
        });
      }
      return result;
    }),

  recordExamIntegrityFlag: protectedProcedure
    .use(platformPermissionMiddleware({ course: ["read"] }))
    .input(learnRecordExamIntegritySchema)
    .output(learnRecordExamIntegrityOutputSchema)
    .mutation(async ({ ctx, input }) => {
      await assertLessonUnlocked(ctx.db, ctx.session, input);
      const lessonRow = await getLessonWithCourseId(ctx.db, input.lessonId);
      if (!lessonRow || lessonRow.courseId !== input.courseId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
      }
      if (lessonRow.type !== "exam") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Integrity tracking is only available for exam lessons",
        });
      }
      await appendExamIntegrityEvent(ctx.db, {
        courseId: input.courseId,
        lessonId: input.lessonId,
        userId: ctx.session.user.id,
        kind: input.kind,
      });
      return { success: true as const };
    }),
});
