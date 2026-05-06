import { redirect } from "@tanstack/react-router";

import type { OrganizationRole } from "@sycom/db/schema/auth";

const ORG_HOME = "/dashboard/org" as const;

const USERS_ROLES = new Set<OrganizationRole>(["owner", "admin"]);
const COHORTS_ROLES = new Set<OrganizationRole>(["owner", "admin", "teacher"]);
const COURSES_ROLES = new Set<OrganizationRole>(["owner", "admin", "teacher"]);
const ORGANIZATION_SETTINGS_ROLES = new Set<OrganizationRole>(["owner"]);

/**
 * Enforce org primary-nav access via route `beforeLoad`. Redirects lack of membership or role mismatch to org home.
 */
export function redirectIfForbiddenOrgRoles(input: {
  memberRole: OrganizationRole | undefined;
  segment: "users" | "cohorts" | "courses" | "organization";
}): void {
  const { memberRole, segment } = input;
  if (!memberRole) {
    throw redirect({ to: ORG_HOME, replace: true });
  }

  let allowed = false;
  if (segment === "users") {
    allowed = USERS_ROLES.has(memberRole);
  } else if (segment === "cohorts") {
    allowed = COHORTS_ROLES.has(memberRole);
  } else if (segment === "courses") {
    allowed = COURSES_ROLES.has(memberRole);
  } else if (segment === "organization") {
    allowed = ORGANIZATION_SETTINGS_ROLES.has(memberRole);
  }

  if (!allowed) {
    throw redirect({ to: ORG_HOME, replace: true });
  }
}
