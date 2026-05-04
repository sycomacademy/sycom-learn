import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useTRPC } from "@/lib/trpc/client";
import { Badge } from "@sycom/ui/components/badge";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@sycom/ui/components/card";

function MetricCard({
  description,
  title,
  value,
}: {
  description: string;
  title: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{description}</CardDescription>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardPanel>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
      </CardPanel>
    </Card>
  );
}

export const Route = createFileRoute("/dashboard/course/$courseId/analytics")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.course.getAnalytics.queryOptions({ courseId: params.courseId }),
    );
  },
  component: CourseAnalyticsPage,
});

function CourseAnalyticsPage() {
  const { courseId } = Route.useParams();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.course.getAnalytics.queryOptions({ courseId }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          description="Learners currently enrolled"
          title="Enrollments"
          value={String(data.overview.enrollmentCount)}
        />
        <MetricCard
          description="Learners who completed the full course"
          title="Completions"
          value={`${data.overview.completedEnrollments} (${data.overview.completionRate}%)`}
        />
        <MetricCard
          description="Certificates issued on full completion"
          title="Certificates"
          value={String(data.overview.certificateCount)}
        />
        <MetricCard
          description="Average scored assessment result"
          title="Avg assessment score"
          value={
            data.overview.averageAssessmentScore == null
              ? "-"
              : `${data.overview.averageAssessmentScore}%`
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          description="Quiz and exam attempts that passed"
          title="Passed assessments"
          value={String(data.overview.passedAssessmentCount)}
        />
        <MetricCard
          description="Quiz and exam attempts that failed"
          title="Failed assessments"
          value={String(data.overview.failedAssessmentCount)}
        />
        <MetricCard
          description="Exam learners who missed the window"
          title="Missed exams"
          value={String(data.overview.examMissedCount)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lesson progress</CardTitle>
          <CardDescription>Completion and assessment outcomes by lesson.</CardDescription>
        </CardHeader>
        <CardPanel className="space-y-3">
          {data.lessons.map((lesson) => (
            <div
              className="flex flex-wrap items-center justify-between gap-3 border px-4 py-3"
              key={lesson.lessonId}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">{lesson.title}</p>
                  <Badge variant="outline">{lesson.type}</Badge>
                  {lesson.questionCount > 0 ? (
                    <Badge variant="secondary">{lesson.questionCount} questions</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{lesson.sectionTitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">
                  {lesson.completedCount}/{lesson.totalLearners} completed
                </Badge>
                <Badge variant="outline">{lesson.completionRate}% complete</Badge>
                {lesson.averageScore != null ? (
                  <Badge variant="outline">Avg score {lesson.averageScore}%</Badge>
                ) : null}
              </div>
            </div>
          ))}
        </CardPanel>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Most missed questions</CardTitle>
          <CardDescription>Only quiz and exam attempts are counted here.</CardDescription>
        </CardHeader>
        <CardPanel className="space-y-3">
          {data.failedQuestions.length === 0 ? (
            <div className="rounded-lg border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              No failed quiz or exam questions yet.
            </div>
          ) : (
            data.failedQuestions.map((question) => (
              <div
                className="space-y-2 border px-4 py-3"
                key={`${question.lessonId}:${question.questionId}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{question.prompt}</p>
                  <Badge variant="outline">{question.type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{question.lessonTitle}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{question.incorrectCount} wrong submissions</Badge>
                  <Badge variant="outline">{question.totalAttempts} attempts</Badge>
                  <Badge variant="outline">{question.incorrectRate}% incorrect</Badge>
                </div>
              </div>
            ))
          )}
        </CardPanel>
      </Card>
    </div>
  );
}
