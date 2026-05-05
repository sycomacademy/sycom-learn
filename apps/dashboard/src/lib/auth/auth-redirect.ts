import type { QueryClient } from "@tanstack/react-query";
import type { AnyRouter } from "@tanstack/react-router";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";

import { dashboardHomeRoute } from "@/lib/auth/dashboard-home-route";
import { applyPendingOwnerInviteActiveOrganization } from "@/lib/auth/pending-owner-invite-org";
import type { AppRouter } from "server/trpc/routers/_app";

const FALLBACK = "/dashboard";

export function safeRedirectPath(value: string | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export function resolvePostAuthRedirect(router: AnyRouter, redirect: string | undefined): string {
  const safe = safeRedirectPath(redirect);
  if (!safe) return FALLBACK;

  const { pathname } = new URL(safe, "http://_");
  const { foundRoute } = router.getMatchedRoutes(pathname);

  if (!foundRoute || foundRoute.id === "/$") return FALLBACK;
  return safe;
}

export async function resolveAuthenticatedEntryHref(
  queryClient: QueryClient,
  trpc: TRPCOptionsProxy<AppRouter>,
  router: AnyRouter,
  redirectSearchParam: string | undefined,
): Promise<string> {
  await applyPendingOwnerInviteActiveOrganization(queryClient);

  const onboarding = await queryClient.fetchQuery(trpc.onboarding.status.queryOptions());

  if (onboarding.defaultNextPath) {
    return onboarding.defaultNextPath;
  }

  const explicit = safeRedirectPath(redirectSearchParam);
  if (explicit) {
    return resolvePostAuthRedirect(router, redirectSearchParam);
  }

  if (onboarding.activeOrganizationId) {
    return dashboardHomeRoute(onboarding.activeOrganizationId);
  }

  return FALLBACK;
}
