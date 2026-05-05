import { createFileRoute, redirect } from "@tanstack/react-router";

import { resolveAuthenticatedEntryHref } from "@/lib/auth/auth-redirect";
import { sessionQueryOptions } from "@/lib/auth/session";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.fetchQuery(sessionQueryOptions());
    if (!session) {
      throw redirect({ to: "/sign-in" });
    }

    const href = await resolveAuthenticatedEntryHref(
      context.queryClient,
      context.trpc,
      context.router,
      undefined,
    );
    throw redirect({ href });
  },
});
