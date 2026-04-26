import { Card, CardDescription, CardHeader, CardTitle } from "@sycom/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/support/report-issue")({
  component: ReportIssuePage,
});

function ReportIssuePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Report issue</CardTitle>
        <CardDescription className="text-sm">
          Placeholder content for the report issue tab.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
