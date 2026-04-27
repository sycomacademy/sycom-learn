import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SecondaryMenu } from "@/components/dashboard/secondary-menu";

export const Route = createFileRoute("/dashboard/admin/users")({
  component: UsersLayout,
});

function UsersLayout() {
  return (
    <div className="mb-10 max-w-6xl md:ml-10">
      <SecondaryMenu
        base="/dashboard/admin/users"
        items={[
          { path: "/dashboard/admin/users", label: "Users" },
          { path: "/dashboard/admin/users/public-invites", label: "Public invites" },
          { path: "/dashboard/admin/users/roles", label: "Roles" },
        ]}
        label="Users"
      />
      <section className="mt-6">
        <Outlet />
      </section>
    </div>
  );
}
