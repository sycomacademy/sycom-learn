import { createFileRoute } from "@tanstack/react-router";

import { redirectIfForbiddenOrgRoles } from "@/lib/auth/org-route-role-access";
export const Route = createFileRoute("/dashboard/org/cohorts")({
  beforeLoad: async ({ context }) => {
    const ctx = await context.queryClient.ensureQueryData(
      context.trpc.organization.workspaceContext.queryOptions(),
    );
    redirectIfForbiddenOrgRoles({
      segment: "cohorts",
      memberRole: ctx.memberRole,
    });
  },
  head: () => ({
    meta: [{ title: "Cohorts | Organization | Sycom LMS" }],
  }),
  component: OrgCohortsPlaceholderPage,
});

function OrgCohortsPlaceholderPage() {
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
