import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import Header from "@/components/dashboard/header";
import { sessionQueryOptions } from "@/lib/auth/session";
import Sidebar from "@/components/dashboard/sidebar";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!session) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      });
    }
    const profile = await context.queryClient.ensureQueryData(context.trpc.me.get.queryOptions());
    return { profile, session: session.session, user: session.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="flex h-svh bg-muted/20">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
