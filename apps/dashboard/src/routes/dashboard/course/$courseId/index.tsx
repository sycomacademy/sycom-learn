import { createFileRoute } from "@tanstack/react-router";

import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@sycom/ui/components/card";

export const Route = createFileRoute("/dashboard/course/$courseId/")({
  component: CourseDetailsPlaceholderPage,
});

function CourseDetailsPlaceholderPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Details & content</CardTitle>
        <CardDescription>Course overview and authoring will appear here.</CardDescription>
      </CardHeader>
      <CardPanel>
        <p className="text-sm text-muted-foreground">Coming soon.</p>
      </CardPanel>
    </Card>
  );
}
