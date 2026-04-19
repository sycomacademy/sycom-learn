import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { DashboardPending } from "@/components/dashboard/pending";
import { StatCard } from "@/components/dashboard/stat-card";
import { useTRPC } from "@/lib/trpc-client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(context.trpc.dashboard.me.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.dashboard.stats.queryOptions()),
    ]),
  pendingComponent: DashboardPending,
  component: DashboardPage,
});

function DashboardPage() {
  const trpc = useTRPC();
  const { data: me } = useSuspenseQuery(trpc.dashboard.me.queryOptions());
  const { data: stats } = useSuspenseQuery(trpc.dashboard.stats.queryOptions());

  const firstName = me.name.split(" ")[0] ?? me.name;

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {firstName}</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening today.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Courses" value={stats.courses} />
        <StatCard label="Assignments" value={stats.assignments} />
        <StatCard label="Active cohorts" value={stats.activeCohorts} />
      </div>
    </div>
  );
}
