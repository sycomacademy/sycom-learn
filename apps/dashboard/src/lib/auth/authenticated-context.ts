import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { useTRPC } from "@/lib/trpc/client";

const authenticatedRouteApi = getRouteApi("/_authenticated");

/** Full `/_authenticated` route context (session guard + `me` preload). */
export function useAuthenticatedContext() {
  return authenticatedRouteApi.useRouteContext();
}

/** Better Auth session record (expiry, etc.) from the parent layout — not the React Query session blob. */
export function useAuthSession() {
  return useAuthenticatedContext().session;
}

/**
 * Current user, kept in sync with `trpc.me.get` cache (seeded by `/_authenticated` `beforeLoad`).
 * Prefer this over reading only route context so optimistic updates and invalidations propagate.
 */
export function useUser() {
  const trpc = useTRPC();
  const { me: meFromContext } = useAuthenticatedContext();
  const { data: me } = useSuspenseQuery({
    ...trpc.me.get.queryOptions(),
    initialData: meFromContext,
  });
  return me;
}
