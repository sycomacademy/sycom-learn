import { and, count, desc, eq, ilike, inArray, isNull, or, type SQL } from "drizzle-orm";

import type { Database } from "..";
import { user, type UserRole } from "../schema/auth";

export type AdminUserStatus = "verified" | "banned" | "unverified";

export type ListAdminUsersInput = {
  page: number;
  pageSize: number;
  query?: string;
  roles?: UserRole[];
  statuses?: AdminUserStatus[];
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

export async function listAdminUsers(database: Database, input: ListAdminUsersInput) {
  const offset = (input.page - 1) * input.pageSize;
  const where = buildListAdminUsersWhere(input);

  const [summary] = await database.select({ totalCount: count() }).from(user).where(where);

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
    .orderBy(desc(user.createdAt))
    .limit(input.pageSize)
    .offset(offset);

  const totalCount = summary?.totalCount ?? 0;

  return {
    page: input.page,
    pageCount: Math.ceil(totalCount / input.pageSize),
    pageSize: input.pageSize,
    rows: rows.map((row) => ({
      ...row,
      status: resolveAdminUserStatus(row),
    })) satisfies AdminUserListItem[],
    totalCount,
  };
}

function buildListAdminUsersWhere(input: ListAdminUsersInput) {
  const conditions: SQL[] = [];
  const normalizedQuery = input.query?.trim();

  if (normalizedQuery) {
    const searchCondition = or(
      ilike(user.name, `%${normalizedQuery}%`),
      ilike(user.email, `%${normalizedQuery}%`),
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
