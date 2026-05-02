import { createFileRoute } from "@tanstack/react-router";

import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@sycom/ui/components/card";

export const Route = createFileRoute("/dashboard/course/$courseId/announcements")({
  component: CourseAnnouncementsPlaceholderPage,
});

function CourseAnnouncementsPlaceholderPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Announcements</CardTitle>
        <CardDescription>Post updates that learners see in the course.</CardDescription>
      </CardHeader>
      <CardPanel>
        <p className="text-sm text-muted-foreground">Coming soon.</p>
      </CardPanel>
    </Card>
  );
}
