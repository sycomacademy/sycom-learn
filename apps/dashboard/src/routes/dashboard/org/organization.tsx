import { createFileRoute } from "@tanstack/react-router";

import { redirectIfForbiddenOrgRoles } from "@/lib/auth/org-route-role-access";
export const Route = createFileRoute("/dashboard/org/organization")({
  beforeLoad: async ({ context }) => {
    const ctx = await context.queryClient.ensureQueryData(
      context.trpc.organization.workspaceContext.queryOptions(),
    );
    redirectIfForbiddenOrgRoles({
      segment: "organization",
      memberRole: ctx.memberRole,
    });
  },
  head: () => ({
    meta: [{ title: "Organization | Sycom LMS" }],
  }),
  component: OrgOrganizationPage,
});

function OrgOrganizationPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 pt-4">
      <h1 className="text-xl font-semibold tracking-tight">Organization</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Organization branding and profile settings will live here—separate from your personal
        account settings.
      </p>
    </div>
  );
}
