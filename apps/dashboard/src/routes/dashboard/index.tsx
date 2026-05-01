import { createFileRoute } from "@tanstack/react-router";

import { AdminOverview } from "@/components/dashboard/admin/overview/admin-overview";
import { JsonViewer } from "@sycom/ui/components/elements/json-viewer";
import { useUser, type ProfileOutput } from "@/hooks/use-user";
import type { UserRole } from "@sycom/db/schema/auth";

export const Route = createFileRoute("/dashboard/")({
  loader: async ({ context }) => {
    const profileData = await context.queryClient.ensureQueryData(
      context.trpc.profile.get.queryOptions(),
    );
    if (profileData.user.role === "platform_admin") {
      await context.queryClient.ensureQueryData(
        context.trpc.admin.getDashboardOverview.queryOptions({}),
      );
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { data } = useUser();

  switch (data.user.role as UserRole) {
    case "platform_admin":
      return <AdminOverview />;
    case "content_creator":
      return <DashboardContent data={data} />;
    case "public_student":
      return <DashboardContent data={data} />;
    default:
      return <DashboardContent data={data} />;
  }
}

function DashboardContent({ data }: { data: ProfileOutput }) {
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
