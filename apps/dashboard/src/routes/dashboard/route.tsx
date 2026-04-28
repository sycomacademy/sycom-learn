import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getSidebarState } from "@/functions/get-sidebar-state";
import { sessionQueryOptions } from "@/lib/auth/session";
import { RootLoader } from "@/components/layout/loader";
import RouteError from "@/components/layout/route-error";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.fetchQuery(sessionQueryOptions());
    if (!session) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      });
    }
  },
  loader: async ({ context }) => {
    const [, sidebarOpen] = await Promise.all([
      context.queryClient.ensureQueryData(context.trpc.profile.get.queryOptions()),
      getSidebarState(),
    ]);
    return { sidebarOpen: sidebarOpen ?? true };
  },
  component: DashboardLayout,
  pendingComponent: RootLoader,
  errorComponent: ({ error, reset }) => <RouteError error={error} mode="screen" reset={reset} />,
});

function DashboardLayout() {
  const { sidebarOpen } = Route.useLoaderData();
  return (
    <DashboardShell defaultOpen={sidebarOpen}>
      <Outlet />
    </DashboardShell>
  );
}
