import { useSuspenseQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, Layers, Users } from "lucide-react";

import { OrgMemberJoinsChart } from "@/components/dashboard/org/overview/org-member-joins-chart";
import { useUser } from "@/hooks/use-user";
import { useTRPC } from "@/lib/trpc/client";
import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { Badge } from "@sycom/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sycom/ui/components/card";
import { formatShortMonthDay } from "@sycom/ui/lib/date";
import { snakeCaseToTitleCase } from "@sycom/ui/lib/string";

import { DashboardGreeting } from "../../admin/overview/dashboard-greeting";
import { OverviewListEmpty, OverviewStatCard } from "../../admin/overview/overview-primitives";

type OrgAdminData = AppRouterOutputs["organization"]["getOwnerAdminOverview"];

export function OrgAdminOverview(): React.ReactElement {
  const trpc = useTRPC();
  const {
    data: { user, profile },
  } = useUser();

  const queryOptions = trpc.organization.getOwnerAdminOverview.queryOptions({});

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
          Snapshot of your organization: people, cohorts, courses, and enrollments.
        </p>
      </div>

      <OrgAdminStatsSection data={overview.data} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <OrgMemberJoinsChart data={overview.data.joinsByDay} />

        <OrgRecentMembersSection data={overview.data} />
      </div>
    </div>
  );
}

function OrgAdminStatsSection({ data }: { data: OrgAdminData }): React.ReactElement {
  const { totals } = data;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <OverviewStatCard
        description="People with a seat in this organization."
        icon={Users}
        title="Members"
        value={totals.members.toLocaleString()}
      />
      <OverviewStatCard
        description="Teams and groups in this organization."
        icon={Layers}
        title="Cohorts"
        value={totals.cohorts.toLocaleString()}
      />
      <OverviewStatCard
        description="Courses owned by this organization."
        icon={BookOpen}
        title="Org courses"
        value={totals.courses.toLocaleString()}
      />
      <OverviewStatCard
        description="All learner enrollments across org-owned courses."
        icon={GraduationCap}
        title="Enrollments"
        value={totals.enrollments.toLocaleString()}
      />
    </div>
  );
}

function OrgRecentMembersSection({ data }: { data: OrgAdminData }): React.ReactElement {
  const { recentMembers } = data;

  return (
    <Card className="h-full shadow-xs">
      <CardHeader>
        <CardTitle>Latest members</CardTitle>
        <CardDescription>Recently added organization members.</CardDescription>
      </CardHeader>
      <CardContent>
        {recentMembers.length === 0 ? (
          <OverviewListEmpty
            description="When people join the organization they will appear here."
            title="No members yet"
          />
        ) : (
          <div className="space-y-3">
            {recentMembers.map((memberRow) => (
              <div
                className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0"
                key={`${memberRow.id}-${memberRow.createdAt.toISOString()}`}
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">{memberRow.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{memberRow.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline">{snakeCaseToTitleCase(memberRow.role)}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatShortMonthDay(memberRow.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
