import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";

import type { Database } from "..";
import { member, organization, user, type UserRole } from "../schema/auth";

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
