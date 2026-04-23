import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getSidebarStateFromCookie } from "@/functions/sidebar-state-cookie";
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
    const profile = await context.queryClient.ensureQueryData(
      context.trpc.profile.get.queryOptions(),
    );
    const sidebarDefaultOpen = getSidebarStateFromCookie() ?? true;
    return { profile, sidebarDefaultOpen };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { sidebarDefaultOpen } = Route.useLoaderData();
  return (
    <DashboardShell defaultOpen={sidebarDefaultOpen}>
      <Outlet />
    </DashboardShell>
  );
}
