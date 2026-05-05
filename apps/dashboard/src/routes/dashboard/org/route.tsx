import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/org")({
  beforeLoad: async ({ context }) => {
    const profileData = await context.queryClient.ensureQueryData(
      context.trpc.profile.get.queryOptions(),
    );
    const activeId = profileData.session.activeOrganizationId;
    if (typeof activeId !== "string" || activeId.length === 0) {
      throw redirect({ to: "/dashboard" });
    }
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.organization.workspaceContext.queryOptions(),
    );
  },
  component: OrgWorkspaceRootLayout,
});

function OrgWorkspaceRootLayout() {
  return (
    <div className="mb-10 md:ml-10">
      <Outlet />
    </div>
  );
}
