import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { DashboardContent } from "@/components/dashboard/dashboard-home";
import { OrgAdminOverview } from "@/components/dashboard/org/overview/org-admin-overview";
import { OrgStudentOverview } from "@/components/dashboard/org/overview/org-student-overview";
import { OrgTeacherOverview } from "@/components/dashboard/org/overview/org-teacher-overview";
import { useUser } from "@/hooks/use-user";
import { useTRPC } from "@/lib/trpc/client";
import type { OrganizationRole } from "@sycom/db/schema/auth";

export const Route = createFileRoute("/dashboard/org/")({
  head: () => ({
    meta: [{ title: "Organization | Sycom LMS" }],
  }),
  loader: async ({ context }) => {
    const workspace = await context.queryClient.ensureQueryData(
      context.trpc.organization.workspaceContext.queryOptions(),
    );
    const role = workspace.memberRole;

    if (role === "owner" || role === "admin") {
      await context.queryClient.ensureQueryData(
        context.trpc.organization.getOwnerAdminOverview.queryOptions({}),
      );
    } else if (role === "teacher") {
      await context.queryClient.ensureQueryData(
        context.trpc.organization.getTeacherOverview.queryOptions({}),
      );
    } else if (role === "student") {
      await context.queryClient.ensureQueryData(
        context.trpc.student.getDashboardOverview.queryOptions({}),
      );
    }
  },
  component: OrgOverviewPage,
});

function OrgOverviewPage() {
  const trpc = useTRPC();
  const { data: workspace } = useSuspenseQuery(trpc.organization.workspaceContext.queryOptions());
  const { data } = useUser();

  switch (workspace.memberRole as OrganizationRole) {
    case "owner":
    case "admin":
      return <OrgAdminOverview />;
    case "teacher":
      return <OrgTeacherOverview />;
    case "student":
      return <OrgStudentOverview />;
    default:
      return <DashboardContent data={data} />;
  }
}
