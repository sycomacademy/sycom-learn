"use client";

import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SecondaryMenu } from "@/components/dashboard/secondary-menu";
import type { SecondaryMenuItem } from "@/components/dashboard/secondary-menu";
import { redirectIfForbiddenOrgRoles } from "@/lib/auth/org-route-role-access";
import type { TRoutes } from "@/router";
import { cn } from "@sycom/ui/lib/utils";

export const Route = createFileRoute("/dashboard/org/users")({
  beforeLoad: async ({ context }) => {
    const ctx = await context.queryClient.ensureQueryData(
      context.trpc.organization.workspaceContext.queryOptions(),
    );
    redirectIfForbiddenOrgRoles({
      segment: "users",
      memberRole: ctx.memberRole,
    });
  },
  component: OrgUsersSectionLayout,
});

const usersSectionPaths = {
  base: "/dashboard/org/users" satisfies TRoutes,
  items: [
    { path: "/dashboard/org/users", label: "Members" },
    { path: "/dashboard/org/users/invites", label: "Invites" },
  ],
} satisfies { base: TRoutes; items: SecondaryMenuItem[] };

function OrgUsersSectionLayout() {
  return (
    <div className={cn("mx-auto w-full max-w-6xl")}>
      <SecondaryMenu base={usersSectionPaths.base} items={usersSectionPaths.items} label="Users" />
      <section className="mt-6">
        <Outlet />
      </section>
    </div>
  );
}
