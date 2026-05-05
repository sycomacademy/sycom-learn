import { createFileRoute } from "@tanstack/react-router";

import { DashboardContent } from "@/components/dashboard/dashboard-home";
import { redirectIfForbiddenOrgRoles } from "@/lib/auth/org-route-role-access";
import { useUser } from "@/hooks/use-user";

export const Route = createFileRoute("/dashboard/org/members")({
  beforeLoad: async ({ context }) => {
    const ctx = await context.queryClient.ensureQueryData(
      context.trpc.organization.workspaceContext.queryOptions(),
    );
    redirectIfForbiddenOrgRoles({
      segment: "members",
      memberRole: ctx.memberRole,
    });
  },
  head: () => ({
    meta: [{ title: "Users | Organization | Sycom LMS" }],
  }),
  component: OrgMembersPlaceholderPage,
});

function OrgMembersPlaceholderPage() {
  const { data } = useUser();
  return (
    <>
      <div className="mx-auto w-full max-w-5xl px-6 pt-4">
        <p className="text-sm text-muted-foreground">Users — Placeholder</p>
      </div>
      <DashboardContent data={data} />
    </>
  );
}
