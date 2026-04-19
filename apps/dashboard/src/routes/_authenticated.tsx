import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import Header from "@/components/dashboard/header";
import { sessionQueryOptions } from "@/lib/auth/session";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!session) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      });
    }
    return { session: session.session, user: session.user };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.me.get.queryOptions()),
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="grid h-svh grid-rows-[auto_1fr]">
      <Header />
      <Outlet />
    </div>
  );
}
