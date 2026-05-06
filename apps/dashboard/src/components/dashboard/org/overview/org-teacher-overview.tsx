import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BookOpenCheck, Layers, Users } from "lucide-react";

import { DashboardGreeting } from "@/components/dashboard/admin/overview/dashboard-greeting";
import {
  OverviewListEmpty,
  OverviewStatCard,
} from "@/components/dashboard/admin/overview/overview-primitives";
import { ContentCreatorEnrollmentsChart } from "@/components/dashboard/creator/overview/content-creator-enrollments-chart";
import { COURSE_STATUS_LABELS } from "@/components/dashboard/course/courses-schema";
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

type TeacherOverviewData = AppRouterOutputs["organization"]["getTeacherOverview"];

export function OrgTeacherOverview(): React.ReactElement {
  const trpc = useTRPC();
  const {
    data: { user, profile },
  } = useUser();

  const queryOptions = trpc.organization.getTeacherOverview.queryOptions({});

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
          Track org courses you instruct and how learners are enrolling.
        </p>
      </div>

      <OrgTeacherStatsSection data={overview.data} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ContentCreatorEnrollmentsChart data={overview.data.enrollmentsByDay} />

        <OrgTeacherRecentCoursesSection data={overview.data} />
      </div>
    </div>
  );
}

function OrgTeacherStatsSection({ data }: { data: TeacherOverviewData }): React.ReactElement {
  const { totals } = data;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <OverviewStatCard
        description="Org courses where you appear as main or secondary instructor."
        icon={Layers}
        title="Assigned courses"
        value={totals.assignedCourses.toLocaleString()}
      />
      <OverviewStatCard
        description="Published org courses visible to learners."
        icon={BookOpenCheck}
        title="Published courses"
        value={totals.publishedCourses.toLocaleString()}
      />
      <OverviewStatCard
        description="Enrollment records across org courses you instruct."
        icon={Users}
        title="Total learners"
        value={totals.totalEnrollments.toLocaleString()}
      />
    </div>
  );
}

function OrgTeacherRecentCoursesSection({
  data,
}: {
  data: TeacherOverviewData;
}): React.ReactElement {
  const { recentCourses } = data;

  return (
    <Card className="h-full shadow-xs">
      <CardHeader>
        <CardTitle>Recently updated courses</CardTitle>
        <CardDescription>Your assigned org courses sorted by latest changes.</CardDescription>
      </CardHeader>
      <CardContent>
        {recentCourses.length === 0 ? (
          <OverviewListEmpty
            description="When you are assigned to an org course, it will show up here."
            title="No assigned org courses yet"
          />
        ) : (
          <div className="space-y-3">
            {recentCourses.map((row) => (
              <div
                className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0"
                key={row.id}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium">{row.title}</p>
                    <Badge variant="outline">{COURSE_STATUS_LABELS[row.status]}</Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    /{row.slug} ·{" "}
                    {row.enrollmentCount === 1 ? "1 learner" : `${row.enrollmentCount} learners`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="text-xs text-muted-foreground">
                    Updated {formatShortMonthDay(row.updatedAt)}
                  </span>
                  <Link
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    params={{ courseId: row.id }}
                    to="/dashboard/org/courses/$courseId"
                  >
                    Open
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
