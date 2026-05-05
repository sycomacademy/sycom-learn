import type { QueryClient } from "@tanstack/react-query";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";

import type { UserRole } from "@sycom/db/schema/auth";

import type { ProfileOutput } from "@/hooks/use-user";
import { useUser } from "@/hooks/use-user";
import type { AppRouter } from "server/trpc/routers/_app";

import { AdminOverview } from "@/components/dashboard/admin/overview/admin-overview";
import { ContentCreatorOverview } from "@/components/dashboard/creator/overview/content-creator-overview";
import { StudentOverview } from "@/components/dashboard/student/overview/student-overview";
import { JsonViewer } from "@sycom/ui/components/elements/json-viewer";

export async function prefetchDashboardHomeQueries(
  queryClient: QueryClient,
  trpc: TRPCOptionsProxy<AppRouter>,
  profileData: ProfileOutput,
) {
  if (profileData.user.role === "platform_admin") {
    await queryClient.ensureQueryData(trpc.admin.getDashboardOverview.queryOptions({}));
  }
  if (profileData.user.role === "content_creator") {
    await queryClient.ensureQueryData(trpc.creator.getDashboardOverview.queryOptions({}));
  }
  if (profileData.user.role === "public_student") {
    await queryClient.ensureQueryData(trpc.student.getDashboardOverview.queryOptions({}));
  }
}

export function DashboardHomePage() {
  const { data } = useUser();

  switch (data.user.role as UserRole) {
    case "platform_admin":
      return <AdminOverview />;
    case "content_creator":
      return <ContentCreatorOverview />;
    case "public_student":
      return <StudentOverview />;
    default:
      return <DashboardContent data={data} />;
  }
}

export function DashboardContent({ data }: { data: ProfileOutput }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back.</p>
      </div>

      <section className="rounded-lg border bg-background p-4">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Profile snapshot</h2>
        <JsonViewer collapsed={2} copyPath data={JSON.parse(JSON.stringify(data))} searchable />
      </section>
    </div>
  );
}
