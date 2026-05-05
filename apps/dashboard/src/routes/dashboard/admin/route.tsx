import { createFileRoute, redirect } from "@tanstack/react-router";

import { dashboardHomeRoute } from "@/lib/auth/dashboard-home-route";
import { sessionQueryOptions } from "@/lib/auth/session";

export const Route = createFileRoute("/dashboard/admin")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.fetchQuery(sessionQueryOptions());
    if (!session) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      });
    }
    if (session.user.role !== "platform_admin") {
      throw redirect({ to: dashboardHomeRoute(session.session.activeOrganizationId) });
    }
  },
});
