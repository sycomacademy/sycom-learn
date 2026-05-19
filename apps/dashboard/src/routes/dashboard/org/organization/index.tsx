import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { OrgOrganizationGeneralSettings } from "@/components/dashboard/org/org-organization-general-settings";
import { useTRPC } from "@/lib/trpc/client";

export const Route = createFileRoute("/dashboard/org/organization/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.organization.workspaceContext.queryOptions(),
    );
  },
  head: () => ({
    meta: [{ title: "Organization | Sycom LMS" }],
  }),
  component: OrgOrganizationGeneralPage,
});

function OrgOrganizationGeneralPage() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.organization.workspaceContext.queryOptions());

  return <OrgOrganizationGeneralSettings workspace={data} />;
}
