import { createFileRoute } from "@tanstack/react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";

export const Route = createFileRoute("/dashboard/admin/logs-analytics/report")({
  component: AdminLogsAnalyticsReportPage,
});

function AdminLogsAnalyticsReportPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Report</CardTitle>
        <CardDescription className="text-sm">
          Review issue reports, moderation escalations, and operational incidents from one place.
          Report management tools are coming soon.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
