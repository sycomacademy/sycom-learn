import type { AnyRouter } from "@tanstack/react-router";

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
