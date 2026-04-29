import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";

import { useTRPC } from "@/lib/trpc/client";

export const Route = createFileRoute("/dashboard/admin/logs-analytics/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.admin.getLogsAnalyticsOverview.queryOptions({}),
    );
  },
  component: AdminLogsAnalyticsActivityPage,
});

function AdminLogsAnalyticsActivityPage() {
  const trpc = useTRPC();
  const query = useQuery(trpc.admin.getLogsAnalyticsOverview.queryOptions({}));
  const overview = query.data;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Activity</CardTitle>
          <CardDescription className="text-sm">
            Live event monitoring shell for platform-wide log activity.
          </CardDescription>
          <p className="text-2xl font-semibold">{overview?.activity.totalEvents24h ?? 0}</p>
          <p className="text-sm text-muted-foreground">Events captured in the last 24 hours</p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Reports queue</CardTitle>
          <CardDescription className="text-sm">
            High-level visibility into incoming reports that still need attention.
          </CardDescription>
          <p className="text-2xl font-semibold">{overview?.reports.pending ?? 0}</p>
          <p className="text-sm text-muted-foreground">Pending reports</p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Feedback queue</CardTitle>
          <CardDescription className="text-sm">
            Placeholder metrics for product feedback triage and response tracking.
          </CardDescription>
          <p className="text-2xl font-semibold">{overview?.feedback.unread ?? 0}</p>
          <p className="text-sm text-muted-foreground">Unread feedback items</p>
        </CardHeader>
      </Card>

      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle className="text-sm">What this section will cover</CardTitle>
          <CardDescription className="text-sm">
            This shell is ready for dashboards, filters, and moderation workflows once the real data
            sources are connected.
          </CardDescription>
          <div className="grid gap-3 pt-2 text-sm text-muted-foreground md:grid-cols-3">
            <p>Flagged events: {overview?.activity.flaggedEvents ?? 0}</p>
            <p>Reports in review: {overview?.reports.inReview ?? 0}</p>
            <p>Feedback triaged today: {overview?.feedback.triagedToday ?? 0}</p>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
