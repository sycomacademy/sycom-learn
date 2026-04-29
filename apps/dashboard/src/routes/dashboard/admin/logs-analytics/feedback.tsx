import { createFileRoute } from "@tanstack/react-router";
import { Card, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";

export const Route = createFileRoute("/dashboard/admin/logs-analytics/feedback")({
  component: AdminLogsAnalyticsFeedbackPage,
});

function AdminLogsAnalyticsFeedbackPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Feedback</CardTitle>
        <CardDescription className="text-sm">
          Centralize qualitative product feedback, team triage, and follow-up workflows here.
          Feedback tooling is coming soon.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
