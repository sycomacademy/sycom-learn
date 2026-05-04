import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BookOpenCheck, Layers, PenLine, Users } from "lucide-react";

import { DashboardGreeting } from "@/components/dashboard/admin/overview/dashboard-greeting";
import {
  OverviewListEmpty,
  OverviewStatCard,
} from "@/components/dashboard/admin/overview/overview-primitives";
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

import { ContentCreatorEnrollmentsChart } from "./content-creator-enrollments-chart";

type CreatorOverviewData = AppRouterOutputs["creator"]["getDashboardOverview"];

export function ContentCreatorOverview(): React.ReactElement {
  const trpc = useTRPC();
  const {
    data: { user, profile },
  } = useUser();

  const queryOptions = trpc.creator.getDashboardOverview.queryOptions({});

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
          Track the courses you help teach and how learners are enrolling.
        </p>
      </div>

      <CreatorStatsSection data={overview.data} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ContentCreatorEnrollmentsChart data={overview.data.enrollmentsByDay} />

        <CreatorRecentCoursesSection data={overview.data} />
      </div>
    </div>
  );
}

function CreatorStatsSection({ data }: { data: CreatorOverviewData }): React.ReactElement {
  const { totals } = data;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <OverviewStatCard
        description="Courses where you appear as main or secondary instructor."
        icon={Layers}
        title="Assigned courses"
        value={totals.assignedCourses.toLocaleString()}
      />
      <OverviewStatCard
        description="Live courses visible to learners on the platform."
        icon={BookOpenCheck}
        title="Published courses"
        value={totals.publishedCourses.toLocaleString()}
      />
      <OverviewStatCard
        description="Courses still in draft while you finalize content."
        icon={PenLine}
        title="Draft courses"
        value={totals.draftCourses.toLocaleString()}
      />
      <OverviewStatCard
        description="Enrollment records across every course you instruct."
        icon={Users}
        title="Total learners"
        value={totals.totalEnrollments.toLocaleString()}
      />
    </div>
  );
}

function CreatorRecentCoursesSection({ data }: { data: CreatorOverviewData }): React.ReactElement {
  const { recentCourses } = data;

  return (
    <Card className="h-full shadow-xs">
      <CardHeader>
        <CardTitle>Recently updated courses</CardTitle>
        <CardDescription>Your assigned courses sorted by latest changes.</CardDescription>
      </CardHeader>
      <CardContent>
        {recentCourses.length === 0 ? (
          <OverviewListEmpty
            description="Ask a platform admin to add you as an instructor on a course, and your work will surface here."
            title="No assigned courses yet"
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
                    to="/dashboard/course/$courseId"
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
