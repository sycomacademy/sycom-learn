import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, Building2, ShieldCheck, Users } from "lucide-react";

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

import { AdminSignupsChart } from "./admin-signups-chart";
import { DashboardGreeting } from "./dashboard-greeting";
import { OverviewListEmpty, OverviewStatCard } from "./overview-primitives";

type AdminOverviewData = AppRouterOutputs["admin"]["getDashboardOverview"];

export function AdminOverview(): React.ReactElement {
  const trpc = useTRPC();
  const {
    data: { user, profile },
  } = useUser();

  const queryOptions = trpc.admin.getDashboardOverview.queryOptions({});

  const overview = useSuspenseQuery({
    ...queryOptions,
    refetchInterval: 1 * 60 * 1000,
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
          Keep an eye on platform growth and open admin work.
        </p>
      </div>

      <AdminStatsSection data={overview.data} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminChartSection data={overview.data} />

        <AdminRecentUsersSection data={overview.data} />
      </div>
    </div>
  );
}

function AdminStatsSection({ data }: { data: AdminOverviewData }): React.ReactElement {
  const { totals } = data;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <OverviewStatCard
        description="Total user accounts across every platform role."
        icon={Users}
        title="Users"
        value={totals.users.toLocaleString()}
      />
      <OverviewStatCard
        description="Non-public organizations currently active on the platform."
        icon={Building2}
        title="Organizations"
        value={totals.organizations.toLocaleString()}
      />
      <OverviewStatCard
        description="Open creator and admin invites that have not expired yet."
        icon={ShieldCheck}
        title="Active invites"
        value={totals.activeInvites.toLocaleString()}
      />
      <OverviewStatCard
        description="Reports still waiting for the admin team to triage."
        icon={AlertTriangle}
        title="Pending reports"
        value={totals.pendingReports.toLocaleString()}
      />
    </div>
  );
}

function AdminChartSection({ data }: { data: AdminOverviewData }): React.ReactElement {
  return <AdminSignupsChart data={data.signupsByDay} />;
}

function AdminRecentUsersSection({ data }: { data: AdminOverviewData }): React.ReactElement {
  const { recentUsers } = data;

  return (
    <Card className="h-full shadow-xs">
      <CardHeader>
        <CardTitle>Latest signups</CardTitle>
        <CardDescription>Recently created users.</CardDescription>
      </CardHeader>
      <CardContent>
        {recentUsers.length === 0 ? (
          <OverviewListEmpty
            description="New accounts will show up here once people start joining the platform."
            title="No recent users"
          />
        ) : (
          <div className="space-y-3">
            {recentUsers.map((recentUser) => (
              <div
                className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0"
                key={recentUser.id}
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">{recentUser.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{recentUser.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline">
                    {recentUser.role ? snakeCaseToTitleCase(recentUser.role) : "Unassigned"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatShortMonthDay(recentUser.createdAt)}
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
