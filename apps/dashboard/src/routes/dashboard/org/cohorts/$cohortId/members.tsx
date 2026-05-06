import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/org/cohorts/$cohortId/members")({
  head: () => ({
    meta: [{ title: "Cohort Members | Organization | Sycom LMS" }],
  }),
  component: CohortMembersPlaceholderPage,
});

function CohortMembersPlaceholderPage() {
  return (
    <div className="rounded-lg border bg-card px-6 py-10 text-sm text-muted-foreground">
      Cohort membership management will land here next.
    </div>
  );
}
