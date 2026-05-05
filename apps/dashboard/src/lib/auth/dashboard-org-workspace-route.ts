const ORG_PREFIX = "/dashboard/org";

function pathnameIsUnderOrgRoutes(pathname: string): boolean {
  return pathname === ORG_PREFIX || pathname.startsWith(`${ORG_PREFIX}/`);
}

/** `/dashboard/**` scopes that remain on the global shell even when org is selected. */
function pathnameKeepsDashboardShellWithoutOrgRedirect(pathname: string): boolean {
  const reservedPrefixes = [
    `${ORG_PREFIX}/`,
    `${ORG_PREFIX}`,
    "/dashboard/admin/",
    "/dashboard/admin",
    "/dashboard/course/",
    "/dashboard/course",
    "/dashboard/catalog/",
    "/dashboard/catalog",
    "/dashboard/library/",
    "/dashboard/library",
    "/dashboard/organisation/",
    "/dashboard/organisation",
  ] as const;

  return reservedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function mapSupportOrSettingsPathToOrg(pathname: string): string | undefined {
  if (
    pathname === "/dashboard/support" ||
    pathname === "/dashboard/support/" ||
    pathname.startsWith("/dashboard/support/")
  ) {
    const withoutPrefix = pathname.replace(/^\/dashboard\/support\/?/, "");
    const tail = withoutPrefix.length > 0 ? `/${withoutPrefix.replace(/^\/+/, "")}` : "";
    return `${ORG_PREFIX}/support${tail}`;
  }

  if (
    pathname === "/dashboard/settings" ||
    pathname === "/dashboard/settings/" ||
    pathname.startsWith("/dashboard/settings/")
  ) {
    const withoutPrefix = pathname.replace(/^\/dashboard\/settings\/?/, "");
    const tail = withoutPrefix.length > 0 ? `/${withoutPrefix.replace(/^\/+/, "")}` : "";
    return `${ORG_PREFIX}/settings${tail}`;
  }

  return undefined;
}

function hasActiveOrganization(
  activeOrganizationId: string | null | undefined,
): activeOrganizationId is string {
  return typeof activeOrganizationId === "string" && activeOrganizationId.length > 0;
}

/**
 * When `/dashboard/org` is reachable but Better Auth has no active org session, bounce to `/dashboard`.
 */
export function dashboardRedirectLeavingOrgRoutesWithoutActiveOrg(
  pathname: string,
  activeOrganizationId: string | null | undefined,
): "/dashboard" | undefined {
  if (!pathnameIsUnderOrgRoutes(pathname)) return undefined;
  if (hasActiveOrganization(activeOrganizationId)) return undefined;
  return "/dashboard";
}

/**
 * Active org selected: `/dashboard/home`, Support, Settings dupes under `/dashboard/...`,
 * and every other non-reserved dashboard URL open in the personal shell → `/dashboard/org` (or org Support/Settings).
 *
 * Admin, course authoring, catalog, library, and legacy `organisation` routes stay put.
 */
export function dashboardRedirectEnteringOrgFromPublicDuplicateRoutes(
  pathname: string,
  activeOrganizationId: string | null | undefined,
): string | undefined {
  if (!hasActiveOrganization(activeOrganizationId)) return undefined;
  if (pathnameIsUnderOrgRoutes(pathname)) return undefined;

  const onDashboard =
    pathname === "/dashboard" || pathname === "/dashboard/" || pathname.startsWith("/dashboard/");
  if (!onDashboard) return undefined;
  if (pathnameKeepsDashboardShellWithoutOrgRedirect(pathname)) return undefined;

  return mapSupportOrSettingsPathToOrg(pathname) ?? ORG_PREFIX;
}
