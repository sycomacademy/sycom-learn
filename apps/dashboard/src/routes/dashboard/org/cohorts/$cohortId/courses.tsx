import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/org/cohorts/$cohortId/courses")({
  head: () => ({
    meta: [{ title: "Cohort Courses | Organization | Sycom LMS" }],
  }),
  component: CohortCoursesPlaceholderPage,
});

function CohortCoursesPlaceholderPage() {
  return (
    <div className="rounded-lg border bg-card px-6 py-10 text-sm text-muted-foreground">
      Cohort course assignment management will land here next.
    </div>
  );
}
