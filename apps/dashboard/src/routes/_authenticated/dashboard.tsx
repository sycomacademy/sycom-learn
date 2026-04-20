import { useSuspenseQuery } from "@tanstack/react-query";
import { Await, createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { DashboardPending } from "@/components/dashboard/pending";
import { StatCard } from "@/components/dashboard/stat-card";
import { useUser } from "@/lib/auth/authenticated-context";
import { useTRPC } from "@/lib/trpc/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(context.trpc.dashboard.stats.queryOptions());
    const activityPromise = context.queryClient.fetchQuery(
      context.trpc.dashboard.activity.queryOptions(),
    );
    return { activityPromise };
  },
  pendingComponent: DashboardPending,
  component: DashboardPage,
});

function DashboardPage() {
  const trpc = useTRPC();
  const { activityPromise } = Route.useLoaderData();
  const me = useUser();
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

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Activity (deferred)</h2>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading activity…</p>}>
          <Await promise={activityPromise}>
            {(activity) => (
              <ul className="list-inside list-disc text-sm text-muted-foreground">
                {activity.items.map((item) => (
                  <li key={item.id}>{item.label}</li>
                ))}
              </ul>
            )}
          </Await>
        </Suspense>
      </section>
    </div>
  );
}
