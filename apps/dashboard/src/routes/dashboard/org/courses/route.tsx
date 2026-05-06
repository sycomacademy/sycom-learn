"use client";

import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";

import { SecondaryMenu } from "@/components/dashboard/secondary-menu";
import { CollapseFade } from "@/components/layout/motion-fade";
import { redirectIfForbiddenOrgRoles } from "@/lib/auth/org-route-role-access";
import type { TRoutes } from "@/router";
import { cn } from "@sycom/ui/lib/utils";

export const Route = createFileRoute("/dashboard/org/courses")({
  beforeLoad: async ({ context }) => {
    const ctx = await context.queryClient.ensureQueryData(
      context.trpc.organization.workspaceContext.queryOptions(),
    );
    redirectIfForbiddenOrgRoles({
      segment: "courses",
      memberRole: ctx.memberRole,
    });
  },
  component: OrgCoursesSectionLayout,
});

function useShowOrgCoursesSecondaryMenu(): boolean {
  return useRouterState({
    select: (state) => {
      const p = state.location.pathname.replace(/\/+$/, "") || "/";
      return p === "/dashboard/org/courses";
    },
  });
}

const ORG_COURSES_BASE = "/dashboard/org/courses" satisfies TRoutes;

function OrgCoursesSectionLayout() {
  const showSecondaryMenu = useShowOrgCoursesSecondaryMenu();

  return (
    <div className={cn("mx-auto w-full max-w-6xl")}>
      <CollapseFade show={showSecondaryMenu}>
        <SecondaryMenu
          base={ORG_COURSES_BASE}
          items={[{ path: ORG_COURSES_BASE, label: "Catalog" }]}
          label="Courses"
        />
      </CollapseFade>
      <section className="mt-6">
        <Outlet />
      </section>
    </div>
  );
}
