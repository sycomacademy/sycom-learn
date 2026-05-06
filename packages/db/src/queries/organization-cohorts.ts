import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import type { Database } from "..";
import { cohort, cohort_member } from "../schema/auth";

export type ListOrganizationCohortsFilter = {
  organizationId: string;
  limit: number;
  offset: number;
  search?: string;
  sortBy: "name" | "createdAt";
  sortDirection: "asc" | "desc";
};

export type OrganizationCohortRow = {
  id: string;
  name: string;
  image: string | null;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ListOrganizationCohortsResult = {
  rows: OrganizationCohortRow[];
  totalCount: number;
};

export async function createOrganizationCohort(
  database: Database,
  input: { organizationId: string; name: string },
): Promise<OrganizationCohortRow> {
  const [created] = await database
    .insert(cohort)
    .values({
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      name: input.name,
    })
    .returning({
      id: cohort.id,
      name: cohort.name,
      image: cohort.image,
      createdAt: cohort.createdAt,
      updatedAt: cohort.updatedAt,
    });

  if (!created) {
    throw new Error("Failed to create cohort");
  }

  return {
    ...created,
    memberCount: 0,
  };
}

const COHORT_SORT_COLUMNS = {
  name: cohort.name,
  createdAt: cohort.createdAt,
} as const;

function buildCohortFilters(input: ListOrganizationCohortsFilter): SQL[] {
  const filters: SQL[] = [eq(cohort.organizationId, input.organizationId)];

  if (input.search) {
    const pattern = `%${input.search}%`;
    const expr = or(ilike(cohort.name, pattern));
    if (expr) {
      filters.push(expr);
    }
  }

  return filters;
}

export async function listOrganizationCohorts(
  database: Database,
  input: ListOrganizationCohortsFilter,
): Promise<ListOrganizationCohortsResult> {
  const filters = buildCohortFilters(input);
  const where = and(...filters);
  const sortColumn = COHORT_SORT_COLUMNS[input.sortBy];
  const orderBy = input.sortDirection === "desc" ? desc(sortColumn) : asc(sortColumn);

  const [rows, totalRow] = await Promise.all([
    database
      .select({
        id: cohort.id,
        name: cohort.name,
        image: cohort.image,
        memberCount: count(cohort_member.id),
        createdAt: cohort.createdAt,
        updatedAt: cohort.updatedAt,
      })
      .from(cohort)
      .leftJoin(cohort_member, eq(cohort_member.teamId, cohort.id))
      .where(where)
      .groupBy(cohort.id)
      .orderBy(orderBy)
      .limit(input.limit)
      .offset(input.offset),
    database.select({ value: count() }).from(cohort).where(where),
  ]);

  return {
    rows,
    totalCount: totalRow[0]?.value ?? 0,
  };
}

export async function getOrganizationCohortById(
  database: Database,
  input: { organizationId: string; cohortId: string },
): Promise<OrganizationCohortRow | null> {
  const [row] = await database
    .select({
      id: cohort.id,
      name: cohort.name,
      image: cohort.image,
      memberCount: count(cohort_member.id),
      createdAt: cohort.createdAt,
      updatedAt: cohort.updatedAt,
    })
    .from(cohort)
    .leftJoin(cohort_member, eq(cohort_member.teamId, cohort.id))
    .where(and(eq(cohort.organizationId, input.organizationId), eq(cohort.id, input.cohortId)))
    .groupBy(cohort.id)
    .limit(1);

  return row ?? null;
}

export async function deleteOrganizationCohort(
  database: Database,
  input: { organizationId: string; cohortId: string },
): Promise<{ deleted: boolean }> {
  const deletedRows = await database
    .delete(cohort)
    .where(and(eq(cohort.organizationId, input.organizationId), eq(cohort.id, input.cohortId)))
    .returning({ id: cohort.id });

  return { deleted: deletedRows.length > 0 };
}
