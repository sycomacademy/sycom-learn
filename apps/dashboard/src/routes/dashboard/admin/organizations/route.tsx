import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SecondaryMenu } from "@/components/dashboard/secondary-menu";

export const Route = createFileRoute("/dashboard/admin/organizations")({
  component: OrganizationsLayout,
});

function OrganizationsLayout() {
  return (
    <div className="mb-10 max-w-6xl md:ml-10">
      <SecondaryMenu
        base="/dashboard/admin/organizations"
        items={[
          { path: "/dashboard/admin/organizations", label: "Organizations" },
          { path: "/dashboard/admin/organizations/invites", label: "Invites" },
          { path: "/dashboard/admin/organizations/domains", label: "Domains" },
        ]}
        label="Organizations"
      />
      <section className="mt-6">
        <Outlet />
      </section>
    </div>
  );
}
