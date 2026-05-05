import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/org/cohorts/roster")({
  head: () => ({
    meta: [{ title: "Roster | Cohorts | Organization | Sycom LMS" }],
  }),
  component: OrgCohortsRosterPlaceholderPage,
});

function OrgCohortsRosterPlaceholderPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 pt-4">
      <h1 className="text-xl font-semibold tracking-tight">Cohort roster</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        View and manage learner membership per cohort—placeholder until the roster ships.
      </p>
    </div>
  );
}
