import { createFileRoute } from "@tanstack/react-router";

import { DashboardContent } from "@/components/dashboard/dashboard-home";
import { useUser } from "@/hooks/use-user";

export const Route = createFileRoute("/dashboard/org/")({
  head: () => ({
    meta: [{ title: "Organization | Sycom LMS" }],
  }),
  component: OrgOverviewPage,
});

function OrgOverviewPage() {
  const { data } = useUser();
  return <DashboardContent data={data} />;
}
