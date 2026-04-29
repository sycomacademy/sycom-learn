import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";

import type { Database } from "..";
import {
  account,
  cohort,
  cohort_member,
  invitation,
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

export type ListAdminOrganizationsFilter = {
  limit: number;
  offset: number;
  search?: string;
  sortBy: "name" | "slug" | "createdAt" | "memberCount" | "owner";
  sortDirection: "asc" | "desc";
};

export type AdminOrganizationMemberPreview = {
  id: string;
  name: string;
  image: string | null;
};

export type AdminOrganizationRow = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: Date;
  memberCount: number;
  cohortCount: number;
  pendingInviteCount: number;
  members: AdminOrganizationMemberPreview[];
  owner: AdminOrganizationMemberPreview | null;
};

export type ListAdminOrganizationsResult = {
  rows: AdminOrganizationRow[];
  totalCount: number;
};

const SORT_COLUMNS = {
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
} as const;

const ORGANIZATION_SORT_COLUMNS = {
  name: organization.name,
  slug: organization.slug,
  createdAt: organization.createdAt,
} as const;

export async function listAdminOrganizations(
  database: Database,
  input: ListAdminOrganizationsFilter,
): Promise<ListAdminOrganizationsResult> {
  const { limit, offset, search, sortBy, sortDirection } = input;

  const filters: SQL[] = [];

  if (search) {
    const pattern = `%${search}%`;
    const expr = or(ilike(organization.name, pattern), ilike(organization.slug, pattern));
    if (expr) filters.push(expr);
  }

  const where = filters.length > 0 ? and(...filters) : undefined;
  const memberCountExpr = sql<number>`cast(count(distinct ${member.userId}) as integer)`;
  const ownerNameExpr = sql<string>`(
    select u.name
    from auth.member m
    join auth."user" u on u.id = m.user_id
    where m.organization_id = ${organization.id} and m.role = 'owner'
    limit 1
  )`;
  const orderBy =
    sortBy === "memberCount"
      ? [
          sortDirection === "desc" ? desc(memberCountExpr) : asc(memberCountExpr),
          asc(organization.name),
        ]
      : sortBy === "owner"
        ? [
            sortDirection === "desc" ? desc(ownerNameExpr) : asc(ownerNameExpr),
            asc(organization.name),
          ]
        : [
            sortDirection === "desc"
              ? desc(ORGANIZATION_SORT_COLUMNS[sortBy])
              : asc(ORGANIZATION_SORT_COLUMNS[sortBy]),
          ];

  const [rows, totalRow] = await Promise.all([
    database
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
        createdAt: organization.createdAt,
        memberCount: memberCountExpr,
        cohortCount: sql<number>`cast(count(distinct ${cohort.id}) as integer)`,
        pendingInviteCount: sql<number>`cast(count(distinct case when ${invitation.status} = 'pending' then ${invitation.id} end) as integer)`,
        ownerName: ownerNameExpr,
      })
      .from(organization)
      .leftJoin(member, eq(member.organizationId, organization.id))
      .leftJoin(cohort, eq(cohort.organizationId, organization.id))
      .leftJoin(invitation, eq(invitation.organizationId, organization.id))
      .where(where)
      .groupBy(organization.id)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset),
    database.select({ value: count() }).from(organization).where(where),
  ]);

  const organizationIds = rows.map((row) => row.id);

  const memberRows =
    organizationIds.length > 0
      ? await database
          .select({
            organizationId: member.organizationId,
            id: user.id,
            name: user.name,
            image: user.image,
            role: member.role,
          })
          .from(member)
          .innerJoin(user, eq(user.id, member.userId))
          .where(inArray(member.organizationId, organizationIds))
          .orderBy(asc(member.organizationId), asc(member.createdAt), asc(user.name))
      : [];

  const membersByOrganization = new Map<string, AdminOrganizationMemberPreview[]>();
  const ownersByOrganization = new Map<string, AdminOrganizationMemberPreview>();

  for (const memberRow of memberRows) {
    if (memberRow.role === "owner") {
      ownersByOrganization.set(memberRow.organizationId, {
        id: memberRow.id,
        name: memberRow.name,
        image: memberRow.image,
      });
    }
    const previews = membersByOrganization.get(memberRow.organizationId) ?? [];
    if (previews.length < 6) {
      previews.push({ id: memberRow.id, name: memberRow.name, image: memberRow.image });
    }
    membersByOrganization.set(memberRow.organizationId, previews);
  }

  return {
    rows: rows.map((row) => ({
      ...row,
      members: membersByOrganization.get(row.id) ?? [],
      owner: ownersByOrganization.get(row.id) ?? null,
    })),
    totalCount: totalRow[0]?.value ?? 0,
  };
}

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
