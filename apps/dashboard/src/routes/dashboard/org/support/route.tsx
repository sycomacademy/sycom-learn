"use client";

import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SecondaryMenu } from "@/components/dashboard/secondary-menu";
import type { SecondaryMenuItem } from "@/components/dashboard/secondary-menu";
import type { TRoutes } from "@/router";

export const Route = createFileRoute("/dashboard/org/support")({
  component: OrgSupportLayout,
});

const orgSupportPaths = {
  base: "/dashboard/org/support/report-issue" satisfies TRoutes,
  items: [
    { path: "/dashboard/org/support/report-issue", label: "Report" },
    { path: "/dashboard/org/support/faqs", label: "FAQ" },
    { path: "/dashboard/org/support/contact", label: "Contact Us" },
  ],
} satisfies { base: TRoutes; items: SecondaryMenuItem[] };

function OrgSupportLayout() {
  return (
    <div className="mx-auto max-w-3xl">
      <SecondaryMenu label="Support" base={orgSupportPaths.base} items={orgSupportPaths.items} />
      <section className="mt-6">
        <Outlet />
      </section>
    </div>
  );
}
