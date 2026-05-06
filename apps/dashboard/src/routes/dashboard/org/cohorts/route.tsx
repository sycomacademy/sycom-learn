import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";

import { CollapseFade } from "@/components/layout/motion-fade";
import { SecondaryMenu } from "@/components/dashboard/secondary-menu";
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
  component: OrgCohortsSectionLayout,
});

function useShowCohortsSecondaryMenu(): boolean {
  return useRouterState({
    select: (state) => {
      const p = state.location.pathname.replace(/\/+$/, "") || "/";
      return p === "/dashboard/org/cohorts";
    },
  });
}

function OrgCohortsSectionLayout() {
  const showSecondaryMenu = useShowCohortsSecondaryMenu();

  return (
    <div className="mb-10 max-w-6xl md:ml-10">
      <CollapseFade show={showSecondaryMenu}>
        <SecondaryMenu
          base="/dashboard/org/cohorts"
          items={[{ path: "/dashboard/org/cohorts", label: "Cohorts" }]}
          label="Cohorts"
        />
      </CollapseFade>

      <section>
        <Outlet />
      </section>
    </div>
  );
}
