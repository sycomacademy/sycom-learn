import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { sessionQueryOptions } from "@/lib/auth/session";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({
    context,
    location,
  }): Promise<{ profile: AppRouterOutputs["profile"]["get"] }> => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!session) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      });
    }
    const profile = await context.queryClient.ensureQueryData(
      context.trpc.profile.get.queryOptions(),
    );
    return { profile };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  );
}
