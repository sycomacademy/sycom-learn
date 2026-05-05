import { Outlet, createFileRoute, redirect, useRouterState } from "@tanstack/react-router";

import { SecondaryMenu } from "@/components/dashboard/secondary-menu";
import type { SecondaryMenuItem } from "@/components/dashboard/secondary-menu";
import { cn } from "@sycom/ui/lib/utils";
import type { TRoutes } from "@/router";

export const Route = createFileRoute("/dashboard/org")({
  beforeLoad: async ({ context }) => {
    const profileData = await context.queryClient.ensureQueryData(
      context.trpc.profile.get.queryOptions(),
    );
    const activeId = profileData.session.activeOrganizationId;
    if (typeof activeId !== "string" || activeId.length === 0) {
      throw redirect({ to: "/dashboard" });
    }
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.organization.workspaceContext.queryOptions(),
    );
  },
  component: OrgWorkspaceLayout,
});

const organizationMenuItems: SecondaryMenuItem[] = [
  { path: "/dashboard/org", label: "Overview" },
  { path: "/dashboard/org/members", label: "Members" },
  { path: "/dashboard/org/courses", label: "Courses" },
];

const orgSupportPaths = {
  base: "/dashboard/org/support/report-issue" satisfies TRoutes,
  items: [
    { path: "/dashboard/org/support/report-issue", label: "Report" },
    { path: "/dashboard/org/support/faqs", label: "FAQ" },
    { path: "/dashboard/org/support/contact", label: "Contact Us" },
  ],
} satisfies { base: TRoutes; items: SecondaryMenuItem[] };

const orgSettingsPaths = {
  base: "/dashboard/org/settings/general" satisfies TRoutes,
  items: [
    { path: "/dashboard/org/settings/general", label: "General" },
    { path: "/dashboard/org/settings/security", label: "Security" },
    { path: "/dashboard/org/settings/preferences", label: "Preferences" },
  ],
} satisfies { base: TRoutes; items: SecondaryMenuItem[] };

function OrgWorkspaceLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const inSupport =
    pathname === "/dashboard/org/support" || pathname.startsWith("/dashboard/org/support/");
  const inSettings =
    pathname === "/dashboard/org/settings" || pathname.startsWith("/dashboard/org/settings/");

  const narrowContent = inSupport || inSettings;

  let menuProps: {
    label: string;
    base: TRoutes;
    items: SecondaryMenuItem[];
  };
  if (inSupport) {
    menuProps = { label: "Support", ...orgSupportPaths };
  } else if (inSettings) {
    menuProps = { label: "Settings", ...orgSettingsPaths };
  } else {
    menuProps = { label: "Organization", base: "/dashboard/org", items: organizationMenuItems };
  }

  return (
    <div className={cn("mb-10 md:ml-10", narrowContent ? "max-w-3xl" : "max-w-6xl")}>
      <SecondaryMenu base={menuProps.base} items={menuProps.items} label={menuProps.label} />

      <section className={narrowContent ? "mt-6" : undefined}>
        <Outlet />
      </section>
    </div>
  );
}
