import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { dashboardHomeRoute } from "@/lib/auth/dashboard-home-route";
import { sessionQueryOptions } from "@/lib/auth/session";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.fetchQuery(sessionQueryOptions());
    if (!session) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      });
    }

    const status = await context.queryClient.ensureQueryData(
      context.trpc.onboarding.status.queryOptions(),
    );
    if (status.defaultNextPath === null) {
      throw redirect({ to: dashboardHomeRoute(status.activeOrganizationId) });
    }
  },
  component: OnboardingLayout,
});

function OnboardingLayout() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center overflow-y-auto bg-background">
      <Outlet />
    </div>
  );
}
