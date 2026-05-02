import { createFileRoute } from "@tanstack/react-router";

import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@sycom/ui/components/card";

export const Route = createFileRoute("/dashboard/course/$courseId/analytics")({
  component: CourseAnalyticsPlaceholderPage,
});

function CourseAnalyticsPlaceholderPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <CardDescription>Track engagement and completion trends.</CardDescription>
      </CardHeader>
      <CardPanel>
        <p className="text-sm text-muted-foreground">Coming soon.</p>
      </CardPanel>
    </Card>
  );
}
