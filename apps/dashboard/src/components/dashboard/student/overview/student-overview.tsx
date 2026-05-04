"use client";

import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Award, BookOpen, GraduationCap, Library } from "lucide-react";

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
import { cn } from "@sycom/ui/lib/utils";
import { formatShortMonthDay } from "@sycom/ui/lib/date";

import { StudentEnrollmentsChart } from "./student-enrollments-chart";

type StudentOverviewData = AppRouterOutputs["student"]["getDashboardOverview"];

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
        <StudentEnrollmentsChart data={overview.data.enrollmentsByDay} />
        <ContinueLearningSection data={overview.data} />
      </div>
    </div>
  );
}

function StudentStatsSection({ data }: { data: StudentOverviewData }): React.ReactElement {
  const { totals } = data;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <OverviewStatCard
        description="Published courses you’re enrolled in (active or completed)."
        icon={Library}
        title="My courses"
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
      <OverviewStatCard
        description="Certificates issued for completed courses."
        icon={Award}
        title="Certificates"
        value={totals.certificatesEarned.toLocaleString()}
      />
    </div>
  );
}

function ContinueLearningSection({ data }: { data: StudentOverviewData }): React.ReactElement {
  const { continueLearning } = data;

  return (
    <Card className="h-full shadow-xs">
      <CardHeader>
        <CardTitle>Continue learning</CardTitle>
        <CardDescription>
          Active courses, ordered by your latest activity. Open a course to view details and
          curriculum.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {continueLearning.length === 0 ? (
          <OverviewListEmpty
            description="Browse the catalog to enroll in a course and your progress will show up here."
            title="No active courses yet"
          />
        ) : (
          <div className="space-y-3">
            {continueLearning.map((row) => (
              <div
                className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0"
                key={row.courseId}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{row.title}</p>
                    {row.certificateIssued ? <Badge variant="outline">Certificate</Badge> : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    /{row.slug} ·{" "}
                    {row.completedLessonCount === row.totalLessonCount && row.totalLessonCount > 0
                      ? "All lessons complete"
                      : `${row.completedLessonCount} / ${row.totalLessonCount} lessons`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {row.lastActivityAt ? (
                    <span className="text-xs text-muted-foreground">
                      Last activity {formatShortMonthDay(row.lastActivityAt)}
                    </span>
                  ) : null}
                  <Link
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    params={{ courseId: row.courseId }}
                    to="/dashboard/catalog/$courseId"
                  >
                    Open course
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
