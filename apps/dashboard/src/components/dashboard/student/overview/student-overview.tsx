"use client";

import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, GraduationCap, Library } from "lucide-react";

import { DashboardGreeting } from "@/components/dashboard/admin/overview/dashboard-greeting";
import {
  OverviewListEmpty,
  OverviewStatCard,
} from "@/components/dashboard/admin/overview/overview-primitives";
import { useUser } from "@/hooks/use-user";
import { useTRPC } from "@/lib/trpc/client";
import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { Badge } from "@sycom/ui/components/badge";
import { buttonVariants } from "@sycom/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sycom/ui/components/card";
import { Progress } from "@sycom/ui/components/progress";
import { cn } from "@sycom/ui/lib/utils";

type StudentOverviewData = AppRouterOutputs["student"]["getDashboardOverview"];
type ContinueLearningRow = StudentOverviewData["continueLearning"][number];

function getProgressPercent(row: ContinueLearningRow): number {
  if (row.totalLessonCount <= 0) return 0;
  return Math.round((row.completedLessonCount / row.totalLessonCount) * 100);
}

export function StudentOverview(): React.ReactElement {
  const trpc = useTRPC();
  const {
    data: { user, profile },
  } = useUser();

  const queryOptions = trpc.student.getDashboardOverview.queryOptions({});
  const overview = useSuspenseQuery({
    ...queryOptions,
    refetchInterval: 60 * 1000,
  });

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <div className="space-y-1">
        <DashboardGreeting
          profileSettings={profile.settings}
          userEmail={user.email}
          userName={user.name}
        />
        <p className="text-sm text-muted-foreground">
          Pick up where you left off and track progress across your catalog.
        </p>
      </div>

      <StudentStatsSection data={overview.data} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ContinueLearningSection data={overview.data} />
        <RecentCourseActivitySection data={overview.data} />
      </div>
    </div>
  );
}

function StudentStatsSection({ data }: { data: StudentOverviewData }): React.ReactElement {
  const { totals } = data;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <OverviewStatCard
        description="Published courses you’re enrolled in (active or completed)."
        icon={Library}
        title="Enrolled"
        value={totals.enrolledCourses.toLocaleString()}
      />
      <OverviewStatCard
        description="Courses you’re currently working through."
        icon={BookOpen}
        title="In progress"
        value={totals.inProgressCourses.toLocaleString()}
      />
      <OverviewStatCard
        description="Courses you’ve finished."
        icon={GraduationCap}
        title="Completed"
        value={totals.completedCourses.toLocaleString()}
      />
    </div>
  );
}

function ContinueLearningSection({ data }: { data: StudentOverviewData }): React.ReactElement {
  const featured = data.continueLearning[0];

  return (
    <Card className="h-full shadow-xs">
      <CardHeader>
        <CardTitle>Continue learning</CardTitle>
        <CardDescription>Pick up the next lesson in your strongest active course.</CardDescription>
      </CardHeader>
      <CardContent>
        {featured ? (
          <FeaturedCourseCard course={featured} />
        ) : (
          <OverviewListEmpty
            description="Enroll in a course from the library and your next lesson will appear here automatically."
            title="Nothing to resume yet"
          />
        )}
      </CardContent>
    </Card>
  );
}

function FeaturedCourseCard({ course }: { course: ContinueLearningRow }): React.ReactElement {
  const progress = getProgressPercent(course);
  const allDone =
    course.totalLessonCount > 0 && course.completedLessonCount >= course.totalLessonCount;

  return (
    <div className="flex flex-col gap-4 border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium">{course.title}</p>
          <p className="truncate text-xs text-muted-foreground">/{course.slug}</p>
        </div>
        <Badge className="shrink-0" variant="outline">
          {progress}% done
        </Badge>
      </div>

      <Progress value={progress}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Course progress</span>
          <span className="text-xs text-muted-foreground tabular-nums">{progress}%</span>
        </div>
        <div className="block h-1.5 w-full overflow-hidden rounded-full bg-input">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Progress>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">
          {allDone
            ? "All lessons complete"
            : `${course.completedLessonCount} of ${course.totalLessonCount} lessons completed`}
        </p>
        <div className="flex items-center gap-2">
          <Link
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            params={{ courseId: course.courseId }}
            to="/dashboard/catalog/$courseId"
          >
            View course
          </Link>
          {course.nextLessonId ? (
            <Link
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
              params={{ courseId: course.courseId, lessonId: course.nextLessonId }}
              to="/learn/course/$courseId/$lessonId"
            >
              Resume
              <ArrowRight className="ml-1 size-3.5" />
            </Link>
          ) : (
            <Link
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
              params={{ courseId: course.courseId }}
              to="/learn/course/$courseId"
            >
              Resume
              <ArrowRight className="ml-1 size-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function RecentCourseActivitySection({ data }: { data: StudentOverviewData }): React.ReactElement {
  const { continueLearning } = data;

  return (
    <Card className="h-full shadow-xs">
      <CardHeader>
        <CardTitle>Recent course activity</CardTitle>
        <CardDescription>Your latest enrollments and current completion status.</CardDescription>
      </CardHeader>
      <CardContent>
        {continueLearning.length === 0 ? (
          <OverviewListEmpty
            description="Once you enroll in a course, it will show up here with progress and quick links."
            title="No learning activity yet"
          />
        ) : (
          <div className="space-y-3">
            {continueLearning.map((row) => {
              const progress = getProgressPercent(row);
              const allDone =
                row.totalLessonCount > 0 && row.completedLessonCount >= row.totalLessonCount;

              return (
                <Link
                  className="flex items-center justify-between gap-3 border-b border-border pb-3 transition-colors last:border-b-0 last:pb-0"
                  key={row.courseId}
                  params={
                    row.nextLessonId
                      ? { courseId: row.courseId, lessonId: row.nextLessonId }
                      : { courseId: row.courseId }
                  }
                  to={
                    row.nextLessonId
                      ? "/learn/course/$courseId/$lessonId"
                      : "/learn/course/$courseId"
                  }
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium">{row.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {allDone
                        ? "All lessons complete"
                        : `${row.completedLessonCount} / ${row.totalLessonCount} lessons completed`}
                    </p>
                  </div>
                  <Badge className="shrink-0" variant="outline">
                    {progress}%
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
