"use client";

import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SecondaryMenu } from "@/components/dashboard/secondary-menu";
import type { SecondaryMenuItem } from "@/components/dashboard/secondary-menu";
import type { TRoutes } from "@/router";

export const Route = createFileRoute("/dashboard/org/settings")({
  component: OrgSettingsLayout,
});

const orgSettingsPaths = {
  base: "/dashboard/org/settings/general" satisfies TRoutes,
  items: [
    { path: "/dashboard/org/settings/general", label: "General" },
    { path: "/dashboard/org/settings/security", label: "Security" },
    { path: "/dashboard/org/settings/preferences", label: "Preferences" },
  ],
} satisfies { base: TRoutes; items: SecondaryMenuItem[] };

function OrgSettingsLayout() {
  return (
    <div className="mb-10 max-w-3xl md:ml-10">
      <SecondaryMenu label="Settings" base={orgSettingsPaths.base} items={orgSettingsPaths.items} />
      <section className="mt-6">
        <Outlet />
      </section>
    </div>
  );
}
