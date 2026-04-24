import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SecondaryMenu } from "@/components/dashboard/secondary-menu";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsLayout,
});

function SettingsLayout() {
  return (
    <div className="mb-10 max-w-3xl md:ml-10">
      <SecondaryMenu
        base="/dashboard/settings/general"
        items={[
          { path: "/dashboard/settings/general", label: "General" },
          { path: "/dashboard/settings/security", label: "Security" },
          {
            path: "/dashboard/settings/preferences",
            label: "Preferences",
          },
        ]}
        label="Settings"
      />
      <section className="mt-6">
        <Outlet />
      </section>
    </div>
  );
}
