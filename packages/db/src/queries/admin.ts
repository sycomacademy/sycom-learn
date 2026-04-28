import { and, asc, count, desc, eq, ilike, inArray, isNull, or, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

import type { Database } from "..";
import { user, type UserRole } from "../schema/auth";

export type AdminUserStatus = "verified" | "banned" | "unverified";

export type ListAdminUsersInput = {
  limit: number;
  offset: number;
  search?: string;
  roles?: UserRole[];
  statuses?: AdminUserStatus[];
  sortBy: "name" | "email" | "createdAt";
  sortDirection: "asc" | "desc";
};

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole | null;
  emailVerified: boolean;
  banned: boolean | null;
  createdAt: Date;
  status: AdminUserStatus;
};

const sortColumns = {
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
} satisfies Record<ListAdminUsersInput["sortBy"], PgColumn>;

export async function listAdminUsers(database: Database, input: ListAdminUsersInput) {
  const where = buildListAdminUsersWhere(input);
  const orderColumn = sortColumns[input.sortBy];
  const orderBy = input.sortDirection === "asc" ? asc(orderColumn) : desc(orderColumn);

  const [summary] = await database.select({ total: count() }).from(user).where(where);

  const rows = await database
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      banned: user.banned,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(where)
    .orderBy(orderBy)
    .limit(input.limit)
    .offset(input.offset);

  return {
    rows: rows.map((row) => ({
      ...row,
      status: resolveAdminUserStatus(row),
    })) satisfies AdminUserListItem[],
    total: summary?.total ?? 0,
    limit: input.limit,
    offset: input.offset,
  };
}

function buildListAdminUsersWhere(input: ListAdminUsersInput) {
  const conditions: SQL[] = [];
  const normalizedSearch = input.search?.trim();

  if (normalizedSearch) {
    const searchCondition = or(
      ilike(user.name, `%${normalizedSearch}%`),
      ilike(user.email, `%${normalizedSearch}%`),
    );

    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  if (input.roles && input.roles.length > 0) {
    conditions.push(inArray(user.role, input.roles));
  }

  if (input.statuses && input.statuses.length > 0) {
    const statusConditions: SQL[] = [];

    for (const status of input.statuses) {
      if (status === "banned") {
        statusConditions.push(eq(user.banned, true));
      }

      if (status === "verified") {
        const verifiedCondition = and(isNotBannedCondition(), eq(user.emailVerified, true));

        if (verifiedCondition) {
          statusConditions.push(verifiedCondition);
        }
      }

      if (status === "unverified") {
        const unverifiedCondition = and(isNotBannedCondition(), eq(user.emailVerified, false));

        if (unverifiedCondition) {
          statusConditions.push(unverifiedCondition);
        }
      }
    }

    const combined = statusConditions.length === 1 ? statusConditions[0] : or(...statusConditions);

    if (combined) {
      conditions.push(combined);
    }
  }

  if (conditions.length === 0) {
    return undefined;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return and(...conditions);
}

function isNotBannedCondition() {
  const condition = or(eq(user.banned, false), isNull(user.banned));

  if (!condition) {
    throw new Error("Expected banned status condition");
  }

  return condition;
}

function resolveAdminUserStatus(userRow: Pick<AdminUserListItem, "banned" | "emailVerified">) {
  if (userRow.banned) {
    return "banned";
  }

  return userRow.emailVerified ? "verified" : "unverified";
}
