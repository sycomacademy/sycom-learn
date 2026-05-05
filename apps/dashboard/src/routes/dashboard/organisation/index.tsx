import {
  DashboardHomePage,
  prefetchDashboardHomeQueries,
} from "@/components/dashboard/dashboard-home";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/organisation/")({
  loader: async ({ context }) => {
    const profileData = await context.queryClient.ensureQueryData(
      context.trpc.profile.get.queryOptions(),
    );
    await prefetchDashboardHomeQueries(context.queryClient, context.trpc, profileData);
  },
  head: () => ({
    meta: [{ title: "Organization | Sycom LMS" }],
  }),
  component: DashboardHomePage,
});
