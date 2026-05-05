import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/org/cohorts/")({
  head: () => ({
    meta: [{ title: "Cohorts | Organization | Sycom LMS" }],
  }),
  component: OrgCohortsOverviewPage,
});

function OrgCohortsOverviewPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 pt-4">
      <h1 className="text-xl font-semibold tracking-tight">Cohorts</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Manage learner cohorts (teams) here. Detailed listing and edits will plug into organization
        data next.
      </p>
    </div>
  );
}
