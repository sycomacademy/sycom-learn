import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { sessionQueryOptions } from "@/lib/auth/session";

export const Route = createFileRoute("/learn")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.fetchQuery(sessionQueryOptions());
    if (!session) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      });
    }
  },
  component: LearnLayout,
});

function LearnLayout() {
  return (
    <div className="min-h-dvh bg-background">
      <Outlet />
    </div>
  );
}
