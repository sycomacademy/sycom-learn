import { createFileRoute, redirect } from "@tanstack/react-router";

import NotFound from "@/components/layout/not-found";
import { sessionQueryOptions } from "@/lib/auth/session";

export const Route = createFileRoute("/$")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!session) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      });
    }
  },
  head: () => ({
    meta: [{ title: "Not found | Sycom" }],
  }),
  component: NotFound,
});
