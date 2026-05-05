import type { TRoutes } from "@/router";

/**
 * Landing path after auth / onboarding when the session has an active organization.
 */
export function dashboardHomeRoute(activeOrganizationId: string | null | undefined): TRoutes {
  if (typeof activeOrganizationId === "string" && activeOrganizationId.length > 0) {
    return "/dashboard/org";
  }
  return "/dashboard";
}
