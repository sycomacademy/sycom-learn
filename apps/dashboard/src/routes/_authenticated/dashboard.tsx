import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useTRPC } from "@/lib/trpc-client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.privateData.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const { session } = Route.useRouteContext();

  const trpc = useTRPC();
  const { data: privateData } = useSuspenseQuery(trpc.privateData.queryOptions());

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {session?.user.name}</p>
      <p>API: {privateData.message}</p>
    </div>
  );
}
