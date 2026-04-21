import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { sessionQueryOptions } from "@/lib/auth/session";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

export const Route = createFileRoute("/_authenticated")({
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
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="flex h-svh bg-muted/20">
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
