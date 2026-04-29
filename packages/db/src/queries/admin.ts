import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";

import type { Database } from "..";
import {
  account,
  cohort,
  cohort_member,
  member,
  organization,
  user,
  type UserRole,
} from "../schema/auth";
import { profile, type ProfileSettings } from "../schema/profile";

type AdminUserStatus = "verified" | "unverified" | "banned";

export type ListAdminUsersFilter = {
  limit: number;
  offset: number;
  search?: string;
  roles?: UserRole[];
  statuses?: AdminUserStatus[];
  sortBy: "name" | "email" | "createdAt";
  sortDirection: "asc" | "desc";
};

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole | null;
  emailVerified: boolean;
  banned: boolean;
  twoFactorEnabled: boolean;
  organizations: string[];
  createdAt: Date;
};

export type ListAdminUsersResult = {
  rows: AdminUserRow[];
  totalCount: number;
};

export type AdminUserDetails = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole | null;
  emailVerified: boolean;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  accounts: string[];
  profile: {
    bio: string | null;
    onboardedAt: Date | null;
    settings: ProfileSettings | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  organizations: Array<{
    id: string;
    name: string;
    role: string;
    joinedAt: Date;
  }>;
  cohorts: Array<{
    id: string;
    name: string;
    organizationId: string;
    organizationName: string;
    joinedAt: Date;
  }>;
};

const SORT_COLUMNS = {
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
} as const;

export async function listAdminUsers(
  database: Database,
  input: ListAdminUsersFilter,
): Promise<ListAdminUsersResult> {
  const { limit, offset, roles, search, sortBy, sortDirection, statuses } = input;

  const filters: SQL[] = [];

  if (search) {
    const pattern = `%${search}%`;
    const expr = or(ilike(user.name, pattern), ilike(user.email, pattern));
    if (expr) filters.push(expr);
  }

  if (roles && roles.length > 0) {
    filters.push(inArray(user.role, roles));
  }

  if (statuses && statuses.length > 0) {
    const statusConds: SQL[] = [];
    if (statuses.includes("banned")) {
      statusConds.push(eq(user.banned, true));
    }
    if (statuses.includes("unverified")) {
      const expr = and(eq(user.banned, false), eq(user.emailVerified, false));
      if (expr) statusConds.push(expr);
    }
    if (statuses.includes("verified")) {
      const expr = and(eq(user.banned, false), eq(user.emailVerified, true));
      if (expr) statusConds.push(expr);
    }
    const combined = or(...statusConds);
    if (combined) filters.push(combined);
  }

  const where = filters.length > 0 ? and(...filters) : undefined;
  const orderBy = sortDirection === "desc" ? desc(SORT_COLUMNS[sortBy]) : asc(SORT_COLUMNS[sortBy]);

  const [rows, totalRow] = await Promise.all([
    database
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        emailVerified: user.emailVerified,
        banned: sql<boolean>`coalesce(${user.banned}, false)`,
        twoFactorEnabled: sql<boolean>`coalesce(${user.twoFactorEnabled}, false)`,
        createdAt: user.createdAt,
        organizations: sql<
          string[]
        >`coalesce(array_agg(${organization.name}) filter (where ${organization.id} is not null), '{}')`,
      })
      .from(user)
      .leftJoin(member, eq(member.userId, user.id))
      .leftJoin(organization, eq(organization.id, member.organizationId))
      .where(where)
      .groupBy(user.id)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    database.select({ value: count() }).from(user).where(where),
  ]);

  return {
    rows,
    totalCount: totalRow[0]?.value ?? 0,
  };
}

export async function getAdminUserById(
  database: Database,
  input: { userId: string },
): Promise<AdminUserDetails | null> {
  const { userId } = input;

  const [userRow, organizationRows, cohortRows, accountRows] = await Promise.all([
    database
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        emailVerified: user.emailVerified,
        banned: sql<boolean>`coalesce(${user.banned}, false)`,
        banReason: user.banReason,
        banExpires: user.banExpires,
        twoFactorEnabled: sql<boolean>`coalesce(${user.twoFactorEnabled}, false)`,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profileBio: profile.bio,
        profileOnboardedAt: profile.onboardedAt,
        profileSettings: profile.settings,
        profileCreatedAt: profile.createdAt,
        profileUpdatedAt: profile.updatedAt,
      })
      .from(user)
      .leftJoin(profile, eq(profile.userId, user.id))
      .where(eq(user.id, userId))
      .limit(1),
    database
      .select({
        id: organization.id,
        name: organization.name,
        role: member.role,
        joinedAt: member.createdAt,
      })
      .from(member)
      .innerJoin(organization, eq(organization.id, member.organizationId))
      .where(eq(member.userId, userId))
      .orderBy(asc(organization.name)),
    database
      .select({
        id: cohort.id,
        name: cohort.name,
        organizationId: organization.id,
        organizationName: organization.name,
        joinedAt: cohort_member.createdAt,
      })
      .from(cohort_member)
      .innerJoin(cohort, eq(cohort.id, cohort_member.teamId))
      .innerJoin(organization, eq(organization.id, cohort.organizationId))
      .where(eq(cohort_member.userId, userId))
      .orderBy(asc(organization.name), asc(cohort.name)),
    database
      .select({ providerId: account.providerId })
      .from(account)
      .where(eq(account.userId, userId))
      .orderBy(asc(account.providerId)),
  ]);

  const row = userRow[0];

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
    role: row.role,
    emailVerified: row.emailVerified,
    banned: row.banned,
    banReason: row.banReason,
    banExpires: row.banExpires,
    twoFactorEnabled: row.twoFactorEnabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    accounts: accountRows.map((accountRow) => accountRow.providerId),
    profile:
      row.profileCreatedAt && row.profileUpdatedAt
        ? {
            bio: row.profileBio,
            onboardedAt: row.profileOnboardedAt,
            settings: row.profileSettings,
            createdAt: row.profileCreatedAt,
            updatedAt: row.profileUpdatedAt,
          }
        : null,
    organizations: organizationRows,
    cohorts: cohortRows,
  };
}
