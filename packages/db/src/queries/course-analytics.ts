import { asc, eq } from "drizzle-orm";

import type { Database } from "..";
import { certificate, enrollment, lessonAttempt, lessonProgress } from "../schema/enrollment";
import { lesson, section, type LessonType } from "../schema/course";
import { countQuestionBlocksInContent, getQuestionDefinitionsFromContent } from "./lesson";

type AttemptAnswer = {
  isCorrect?: boolean;
  prompt?: string;
  questionId?: string;
  selected?: string[];
  type?: "single" | "multi";
};

export type CourseAnalyticsOverview = {
  averageAssessmentScore: number | null;
  certificateCount: number;
  completedEnrollments: number;
  completionRate: number;
  enrollmentCount: number;
  examMissedCount: number;
  failedAssessmentCount: number;
  passedAssessmentCount: number;
};

export type CourseAnalyticsLessonRow = {
  averageScore: number | null;
  completedCount: number;
  completionRate: number;
  lessonId: string;
  questionCount: number;
  sectionId: string;
  sectionTitle: string;
  title: string;
  totalLearners: number;
  type: LessonType;
};

export type CourseAnalyticsFailedQuestionRow = {
  incorrectCount: number;
  incorrectRate: number;
  lessonId: string;
  lessonTitle: string;
  prompt: string;
  questionId: string;
  totalAttempts: number;
  type: LessonType;
};

export type CourseAnalytics = {
  failedQuestions: CourseAnalyticsFailedQuestionRow[];
  lessons: CourseAnalyticsLessonRow[];
  overview: CourseAnalyticsOverview;
};

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

export async function getCourseAnalytics(
  database: Database,
  input: { courseId: string },
): Promise<CourseAnalytics> {
  const [lessonRows, enrollmentRows, certificateRows, attemptRows, progressRows] =
    await Promise.all([
      database
        .select({
          content: lesson.content,
          dueAt: lesson.dueAt,
          lessonId: lesson.id,
          openAt: lesson.openAt,
          sectionId: lesson.sectionId,
          sectionTitle: section.title,
          title: lesson.title,
          type: lesson.type,
        })
        .from(lesson)
        .innerJoin(section, eq(lesson.sectionId, section.id))
        .where(eq(section.courseId, input.courseId))
        .orderBy(
          asc(section.order),
          asc(section.createdAt),
          asc(lesson.order),
          asc(lesson.createdAt),
        ),
      database.select().from(enrollment).where(eq(enrollment.courseId, input.courseId)),
      database.select().from(certificate).where(eq(certificate.courseId, input.courseId)),
      database
        .select({
          answers: lessonAttempt.answers,
          enrollmentId: lessonAttempt.enrollmentId,
          lessonId: lessonAttempt.lessonId,
          maxScore: lessonAttempt.maxScore,
          passed: lessonAttempt.passed,
          score: lessonAttempt.score,
        })
        .from(lessonAttempt)
        .innerJoin(enrollment, eq(lessonAttempt.enrollmentId, enrollment.id))
        .where(eq(enrollment.courseId, input.courseId)),
      database
        .select({
          enrollmentId: lessonProgress.enrollmentId,
          lessonId: lessonProgress.lessonId,
          status: lessonProgress.status,
        })
        .from(lessonProgress)
        .innerJoin(enrollment, eq(lessonProgress.enrollmentId, enrollment.id))
        .where(eq(enrollment.courseId, input.courseId)),
    ]);

  const enrollmentIds = enrollmentRows.map((row) => row.id);
  const totalLearners = enrollmentRows.length;
  const completedEnrollments = enrollmentRows.filter((row) => row.status === "completed").length;
  const completionRate =
    totalLearners === 0 ? 0 : roundToOneDecimal((completedEnrollments / totalLearners) * 100);
  const scoredAttempts = attemptRows.filter((row) => row.maxScore > 0);
  const averageAssessmentScore =
    scoredAttempts.length === 0
      ? null
      : roundToOneDecimal(
          (scoredAttempts.reduce((sum, row) => sum + row.score / row.maxScore, 0) /
            scoredAttempts.length) *
            100,
        );
  const passedAssessmentCount = scoredAttempts.filter((row) => row.passed).length;
  const failedAssessmentCount = scoredAttempts.length - passedAssessmentCount;

  const progressByLesson = new Map<string, typeof progressRows>();
  for (const row of progressRows) {
    const bucket = progressByLesson.get(row.lessonId) ?? [];
    bucket.push(row);
    progressByLesson.set(row.lessonId, bucket);
  }

  const attemptsByLesson = new Map<string, typeof attemptRows>();
  for (const row of attemptRows) {
    const bucket = attemptsByLesson.get(row.lessonId) ?? [];
    bucket.push(row);
    attemptsByLesson.set(row.lessonId, bucket);
  }

  const lessons: CourseAnalyticsLessonRow[] = lessonRows.map((row) => {
    const progresses = progressByLesson.get(row.lessonId) ?? [];
    const attempts = attemptsByLesson.get(row.lessonId) ?? [];
    const completedCount = progresses.filter((progress) => progress.status === "completed").length;
    const completionRateForLesson =
      totalLearners === 0 ? 0 : roundToOneDecimal((completedCount / totalLearners) * 100);
    const averageScore =
      row.type === "quiz" || row.type === "exam"
        ? attempts.length === 0
          ? null
          : roundToOneDecimal(
              (attempts.reduce(
                (sum, attempt) => sum + attempt.score / Math.max(attempt.maxScore, 1),
                0,
              ) /
                attempts.length) *
                100,
            )
        : null;

    return {
      averageScore,
      completedCount,
      completionRate: completionRateForLesson,
      lessonId: row.lessonId,
      questionCount: countQuestionBlocksInContent(row.content),
      sectionId: row.sectionId,
      sectionTitle: row.sectionTitle,
      title: row.title,
      totalLearners,
      type: row.type,
    };
  });

  const now = new Date();
  const examMissedCount = lessonRows
    .filter((row) => row.type === "exam" && row.dueAt && row.dueAt < now)
    .reduce((sum, row) => {
      const completedEnrollmentIds = new Set(
        (progressByLesson.get(row.lessonId) ?? [])
          .filter((progress) => progress.status === "completed")
          .map((progress) => progress.enrollmentId),
      );

      return (
        sum +
        enrollmentIds.filter((enrollmentId) => !completedEnrollmentIds.has(enrollmentId)).length
      );
    }, 0);

  const failedQuestionAccumulator = new Map<string, CourseAnalyticsFailedQuestionRow>();

  for (const lessonRow of lessonRows) {
    if (lessonRow.type !== "quiz" && lessonRow.type !== "exam") {
      continue;
    }

    const questionMap = new Map(
      getQuestionDefinitionsFromContent(lessonRow.content).map((question) => [
        question.questionId,
        question.prompt,
      ]),
    );
    const attempts = attemptsByLesson.get(lessonRow.lessonId) ?? [];

    for (const attempt of attempts) {
      const answers = Array.isArray(attempt.answers) ? (attempt.answers as AttemptAnswer[]) : [];
      for (const answer of answers) {
        const questionId = typeof answer.questionId === "string" ? answer.questionId : null;
        if (!questionId || answer.isCorrect !== false) {
          continue;
        }

        const key = `${lessonRow.lessonId}:${questionId}`;
        const current = failedQuestionAccumulator.get(key);
        const prompt =
          typeof answer.prompt === "string" && answer.prompt.trim() !== ""
            ? answer.prompt
            : (questionMap.get(questionId) ?? "Untitled question");

        if (current) {
          current.incorrectCount += 1;
          current.totalAttempts += 1;
          current.incorrectRate = roundToOneDecimal(
            (current.incorrectCount / current.totalAttempts) * 100,
          );
          continue;
        }

        failedQuestionAccumulator.set(key, {
          incorrectCount: 1,
          incorrectRate: 100,
          lessonId: lessonRow.lessonId,
          lessonTitle: lessonRow.title,
          prompt,
          questionId,
          totalAttempts: 1,
          type: lessonRow.type,
        });
      }
    }
  }

  const failedQuestions = [...failedQuestionAccumulator.values()].sort(
    (left, right) =>
      right.incorrectCount - left.incorrectCount || right.incorrectRate - left.incorrectRate,
  );

  return {
    failedQuestions,
    lessons,
    overview: {
      averageAssessmentScore,
      certificateCount: certificateRows.length,
      completedEnrollments,
      completionRate,
      enrollmentCount: totalLearners,
      examMissedCount,
      failedAssessmentCount,
      passedAssessmentCount,
    },
  };
}
