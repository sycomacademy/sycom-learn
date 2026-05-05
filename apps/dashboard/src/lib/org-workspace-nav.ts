import type { OrganizationRole } from "@sycom/db/schema/auth";
import type { TRoutes } from "@/router";

export type OrgWorkspacePrimarySlug = "overview" | "users" | "cohorts" | "organization" | "courses";

/** Canonical URLs for primary org chrome navigation. */
export const ORG_PRIMARY_PATHS = {
  overview: "/dashboard/org",
  users: "/dashboard/org/members",
  cohorts: "/dashboard/org/cohorts",
  organization: "/dashboard/org/organization",
  courses: "/dashboard/org/courses",
} satisfies Record<OrgWorkspacePrimarySlug, TRoutes>;

const OWNER_ORDER: OrgWorkspacePrimarySlug[] = [
  "overview",
  "users",
  "cohorts",
  "organization",
  "courses",
];

const ADMIN_ORDER: OrgWorkspacePrimarySlug[] = ["overview", "users", "cohorts", "courses"];

const TEACHER_ORDER: OrgWorkspacePrimarySlug[] = ["overview", "cohorts", "courses"];

const STUDENT_ORDER: OrgWorkspacePrimarySlug[] = ["overview", "courses"];

/** Primary tab slug order per org membership role. */
export function getOrgWorkspacePrimarySlugs(role: OrganizationRole): OrgWorkspacePrimarySlug[] {
  switch (role) {
    case "owner":
      return OWNER_ORDER;
    case "admin":
      return ADMIN_ORDER;
    case "teacher":
      return TEACHER_ORDER;
    case "student":
      return STUDENT_ORDER;
  }
}

const LABEL_BY_SLUG: Record<OrgWorkspacePrimarySlug, string> = {
  overview: "Overview",
  users: "Users",
  cohorts: "Cohorts",
  organization: "Organization",
  courses: "Courses",
};

export function orgWorkspaceSlugToLabel(slug: OrgWorkspacePrimarySlug): string {
  return LABEL_BY_SLUG[slug];
}

export function orgWorkspaceSlugToPath(slug: OrgWorkspacePrimarySlug): TRoutes {
  return ORG_PRIMARY_PATHS[slug];
}
