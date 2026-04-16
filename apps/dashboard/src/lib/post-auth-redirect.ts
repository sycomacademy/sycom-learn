import type { AnyRouter } from "@tanstack/react-router";

const FALLBACK = "/dashboard";

export function resolvePostAuthRedirect(router: AnyRouter, redirect: string | undefined): string {
  if (!redirect) return FALLBACK;
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return FALLBACK;

  const { pathname } = new URL(redirect, "http://_");
  const { foundRoute } = router.getMatchedRoutes(pathname);

  if (!foundRoute || foundRoute.id === "/$") return FALLBACK;
  return redirect;
}
