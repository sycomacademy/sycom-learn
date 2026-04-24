import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getSidebarState } from "@/functions/get-sidebar-state";
import { sessionQueryOptions } from "@/lib/auth/session";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!session) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      });
    }
  },
  loader: async ({ context }) => {
    const [profile, sidebarOpen] = await Promise.all([
      context.queryClient.ensureQueryData(context.trpc.profile.get.queryOptions()),
      getSidebarState(),
    ]);
    return { profile, sidebarOpen: sidebarOpen ?? true };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { sidebarOpen } = Route.useLoaderData();
  return (
    <DashboardShell defaultOpen={sidebarOpen}>
      <Outlet />
    </DashboardShell>
  );
}
