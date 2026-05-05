"use client";

import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SecondaryMenu } from "@/components/dashboard/secondary-menu";
import type { SecondaryMenuItem } from "@/components/dashboard/secondary-menu";
import { redirectIfForbiddenOrgRoles } from "@/lib/auth/org-route-role-access";
import type { TRoutes } from "@/router";
import { cn } from "@sycom/ui/lib/utils";

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

const cohortsSectionPaths = {
  base: "/dashboard/org/cohorts" satisfies TRoutes,
  items: [
    { path: "/dashboard/org/cohorts", label: "Overview" },
    { path: "/dashboard/org/cohorts/roster", label: "Roster" },
  ],
} satisfies { base: TRoutes; items: SecondaryMenuItem[] };

function OrgCohortsSectionLayout() {
  return (
    <div className={cn("mx-auto w-full max-w-6xl")}>
      <SecondaryMenu
        base={cohortsSectionPaths.base}
        items={cohortsSectionPaths.items}
        label="Cohorts"
      />
      <section className="mt-6">
        <Outlet />
      </section>
    </div>
  );
}
