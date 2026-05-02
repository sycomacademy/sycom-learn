import { createFileRoute } from "@tanstack/react-router";

import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@sycom/ui/components/card";

export const Route = createFileRoute("/dashboard/course/$courseId/members")({
  component: CourseMembersPlaceholderPage,
});

function CourseMembersPlaceholderPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>Manage enrolled learners for this course.</CardDescription>
      </CardHeader>
      <CardPanel>
        <p className="text-sm text-muted-foreground">Coming soon.</p>
      </CardPanel>
    </Card>
  );
}
