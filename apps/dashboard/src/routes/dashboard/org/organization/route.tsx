import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SecondaryMenu } from "@/components/dashboard/secondary-menu";
import type { SecondaryMenuItem } from "@/components/dashboard/secondary-menu";
import { redirectIfForbiddenOrgRoles } from "@/lib/auth/org-route-role-access";
import type { TRoutes } from "@/router";

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
  component: OrgOrganizationSectionLayout,
});

const organizationSectionPaths = {
  base: "/dashboard/org/organization" satisfies TRoutes,
  items: [
    { path: "/dashboard/org/organization", label: "General" },
    { path: "/dashboard/org/organization/rules", label: "Rules" },
    { path: "/dashboard/org/organization/integrations", label: "Integrations" },
  ],
} satisfies { base: TRoutes; items: SecondaryMenuItem[] };

function OrgOrganizationSectionLayout() {
  return (
    <div className="mb-10 max-w-3xl md:ml-10">
      <SecondaryMenu
        base={organizationSectionPaths.base}
        items={organizationSectionPaths.items}
        label="Organization"
      />
      <section className="mt-6">
        <Outlet />
      </section>
    </div>
  );
}
