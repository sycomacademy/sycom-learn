import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  notInArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import type { Database } from "..";
import { cohort, cohort_member, member, user } from "../schema/auth";
import { cohortCourse, course } from "../schema/course";
import { enrollment } from "../schema/enrollment";

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

export type CohortMemberRow = {
  userId: string;
  memberId: string;
  name: string;
  email: string;
  image: string | null;
  role: "owner" | "admin" | "teacher" | "student";
  joinedAt: Date;
};

export type CohortCourseRow = {
  courseId: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  status: "draft" | "published";
  updatedAt: Date;
};

type CohortEntityListFilter = {
  organizationId: string;
  cohortId: string;
  limit: number;
  offset: number;
  search?: string;
};

export async function listCohortMembers(
  database: Database,
  input: CohortEntityListFilter,
): Promise<{ rows: CohortMemberRow[]; totalCount: number }> {
  const filters: SQL[] = [
    eq(member.organizationId, input.organizationId),
    sql`${member.userId} in (select ${cohort_member.userId} from ${cohort_member} where ${eq(cohort_member.teamId, input.cohortId)})`,
  ];

  if (input.search) {
    const pattern = `%${input.search}%`;
    const expr = or(ilike(user.name, pattern), ilike(user.email, pattern));
    if (expr) {
      filters.push(expr);
    }
  }

  const where = and(...filters);

  const [rows, totalRows] = await Promise.all([
    database
      .select({
        userId: user.id,
        memberId: member.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: member.role,
        joinedAt: member.createdAt,
      })
      .from(member)
      .innerJoin(user, eq(user.id, member.userId))
      .where(where)
      .orderBy(asc(user.name))
      .limit(input.limit)
      .offset(input.offset),
    database
      .select({ value: count() })
      .from(member)
      .innerJoin(user, eq(user.id, member.userId))
      .where(where),
  ]);

  return { rows, totalCount: totalRows[0]?.value ?? 0 };
}

export async function listAvailableOrgMembersForCohort(
  database: Database,
  input: CohortEntityListFilter,
): Promise<{ rows: CohortMemberRow[]; totalCount: number }> {
  const assignedRows = await database
    .select({ userId: cohort_member.userId })
    .from(cohort_member)
    .where(eq(cohort_member.teamId, input.cohortId));
  const assignedUserIds = assignedRows.map((row) => row.userId);

  const filters: SQL[] = [eq(member.organizationId, input.organizationId)];
  if (assignedUserIds.length > 0) {
    filters.push(notInArray(member.userId, assignedUserIds));
  }
  if (input.search) {
    const pattern = `%${input.search}%`;
    const expr = or(ilike(user.name, pattern), ilike(user.email, pattern));
    if (expr) {
      filters.push(expr);
    }
  }

  const where = and(...filters);

  const [rows, totalRows] = await Promise.all([
    database
      .select({
        userId: user.id,
        memberId: member.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: member.role,
        joinedAt: member.createdAt,
      })
      .from(member)
      .innerJoin(user, eq(user.id, member.userId))
      .where(where)
      .orderBy(asc(user.name))
      .limit(input.limit)
      .offset(input.offset),
    database
      .select({ value: count() })
      .from(member)
      .innerJoin(user, eq(user.id, member.userId))
      .where(where),
  ]);

  return { rows, totalCount: totalRows[0]?.value ?? 0 };
}

export async function addMembersToCohort(
  database: Database,
  input: { organizationId: string; cohortId: string; userIds: string[] },
): Promise<void> {
  if (input.userIds.length === 0) {
    return;
  }

  await database
    .insert(cohort_member)
    .values(
      input.userIds.map((userId) => ({
        id: crypto.randomUUID(),
        teamId: input.cohortId,
        userId,
      })),
    )
    .onConflictDoNothing({ target: [cohort_member.teamId, cohort_member.userId] });

  const studentRows = await database
    .select({ userId: member.userId })
    .from(member)
    .where(
      and(
        eq(member.organizationId, input.organizationId),
        eq(member.role, "student"),
        inArray(member.userId, input.userIds),
      ),
    );

  if (studentRows.length === 0) {
    return;
  }

  const cohortCourseRows = await database
    .select({ courseId: cohortCourse.courseId })
    .from(cohortCourse)
    .innerJoin(course, eq(course.id, cohortCourse.courseId))
    .where(
      and(
        eq(cohortCourse.cohortId, input.cohortId),
        eq(course.organizationId, input.organizationId),
      ),
    );

  if (cohortCourseRows.length === 0) {
    return;
  }

  const timestamp = new Date();
  await database
    .insert(enrollment)
    .values(
      studentRows.flatMap((student) =>
        cohortCourseRows.map((cohortCourseRow) => ({
          courseId: cohortCourseRow.courseId,
          userId: student.userId,
          accessSource: "org_grant" as const,
          status: "active" as const,
          startedAt: timestamp,
          lastActivityAt: timestamp,
        })),
      ),
    )
    .onConflictDoNothing({ target: [enrollment.courseId, enrollment.userId] });
}

export async function removeMembersFromCohort(
  database: Database,
  input: { organizationId: string; cohortId: string; userIds: string[] },
): Promise<void> {
  if (input.userIds.length === 0) {
    return;
  }

  await database
    .delete(cohort_member)
    .where(
      and(eq(cohort_member.teamId, input.cohortId), inArray(cohort_member.userId, input.userIds)),
    );

  const studentRows = await database
    .select({ userId: member.userId })
    .from(member)
    .where(
      and(
        eq(member.organizationId, input.organizationId),
        eq(member.role, "student"),
        inArray(member.userId, input.userIds),
      ),
    );
  if (studentRows.length === 0) {
    return;
  }

  const cohortCourseRows = await database
    .select({ courseId: cohortCourse.courseId })
    .from(cohortCourse)
    .innerJoin(course, eq(course.id, cohortCourse.courseId))
    .where(
      and(
        eq(cohortCourse.cohortId, input.cohortId),
        eq(course.organizationId, input.organizationId),
      ),
    );
  if (cohortCourseRows.length === 0) {
    return;
  }

  const studentUserIds = studentRows.map((row) => row.userId);
  const affectedCourseIds = cohortCourseRows.map((row) => row.courseId);

  await database.delete(enrollment).where(
    and(
      inArray(enrollment.userId, studentUserIds),
      inArray(enrollment.courseId, affectedCourseIds),
      sql`not exists (
          select 1
          from ${cohort_member} cm
          inner join ${cohortCourse} cc on cc.cohort_id = cm.team_id
          inner join ${cohort} c on c.id = cm.team_id
          where cm.user_id = ${enrollment.userId}
            and cc.course_id = ${enrollment.courseId}
            and c.organization_id = ${input.organizationId}
        )`,
    ),
  );
}

export async function listCohortCourses(
  database: Database,
  input: CohortEntityListFilter,
): Promise<{ rows: CohortCourseRow[]; totalCount: number }> {
  const filters: SQL[] = [eq(course.organizationId, input.organizationId)];
  filters.push(
    sql`${course.id} in (select ${cohortCourse.courseId} from ${cohortCourse} where ${eq(cohortCourse.cohortId, input.cohortId)})`,
  );
  if (input.search) {
    const pattern = `%${input.search}%`;
    const expr = or(ilike(course.title, pattern), ilike(course.slug, pattern));
    if (expr) {
      filters.push(expr);
    }
  }

  const where = and(...filters);
  const [rows, totalRows] = await Promise.all([
    database
      .select({
        courseId: course.id,
        title: course.title,
        slug: course.slug,
        imageUrl: course.imageUrl,
        status: course.status,
        updatedAt: course.updatedAt,
      })
      .from(course)
      .where(where)
      .orderBy(asc(course.title))
      .limit(input.limit)
      .offset(input.offset),
    database.select({ value: count() }).from(course).where(where),
  ]);

  return { rows, totalCount: totalRows[0]?.value ?? 0 };
}

export async function listAvailableOrgCoursesForCohort(
  database: Database,
  input: CohortEntityListFilter,
): Promise<{ rows: CohortCourseRow[]; totalCount: number }> {
  const assignedRows = await database
    .select({ courseId: cohortCourse.courseId })
    .from(cohortCourse)
    .where(eq(cohortCourse.cohortId, input.cohortId));
  const assignedCourseIds = assignedRows.map((row) => row.courseId);

  const filters: SQL[] = [eq(course.organizationId, input.organizationId)];
  if (assignedCourseIds.length > 0) {
    filters.push(notInArray(course.id, assignedCourseIds));
  }
  if (input.search) {
    const pattern = `%${input.search}%`;
    const expr = or(ilike(course.title, pattern), ilike(course.slug, pattern));
    if (expr) {
      filters.push(expr);
    }
  }

  const where = and(...filters);
  const [rows, totalRows] = await Promise.all([
    database
      .select({
        courseId: course.id,
        title: course.title,
        slug: course.slug,
        imageUrl: course.imageUrl,
        status: course.status,
        updatedAt: course.updatedAt,
      })
      .from(course)
      .where(where)
      .orderBy(asc(course.title))
      .limit(input.limit)
      .offset(input.offset),
    database.select({ value: count() }).from(course).where(where),
  ]);

  return { rows, totalCount: totalRows[0]?.value ?? 0 };
}

export async function addCoursesToCohort(
  database: Database,
  input: { organizationId: string; cohortId: string; courseIds: string[] },
): Promise<void> {
  if (input.courseIds.length === 0) {
    return;
  }

  await database
    .insert(cohortCourse)
    .values(
      input.courseIds.map((courseId) => ({
        id: `ccr_${crypto.randomUUID()}`,
        cohortId: input.cohortId,
        courseId,
      })),
    )
    .onConflictDoNothing({ target: [cohortCourse.cohortId, cohortCourse.courseId] });

  const studentRows = await database
    .select({ userId: cohort_member.userId })
    .from(cohort_member)
    .innerJoin(member, eq(member.userId, cohort_member.userId))
    .where(
      and(
        eq(cohort_member.teamId, input.cohortId),
        eq(member.organizationId, input.organizationId),
        eq(member.role, "student"),
      ),
    );

  if (studentRows.length === 0) {
    return;
  }

  const orgCourseRows = await database
    .select({ courseId: course.id })
    .from(course)
    .where(
      and(eq(course.organizationId, input.organizationId), inArray(course.id, input.courseIds)),
    );

  if (orgCourseRows.length === 0) {
    return;
  }

  const timestamp = new Date();
  await database
    .insert(enrollment)
    .values(
      studentRows.flatMap((student) =>
        orgCourseRows.map((courseRow) => ({
          courseId: courseRow.courseId,
          userId: student.userId,
          accessSource: "org_grant" as const,
          status: "active" as const,
          startedAt: timestamp,
          lastActivityAt: timestamp,
        })),
      ),
    )
    .onConflictDoNothing({ target: [enrollment.courseId, enrollment.userId] });
}

export async function removeCoursesFromCohort(
  database: Database,
  input: { organizationId: string; cohortId: string; courseIds: string[] },
): Promise<void> {
  if (input.courseIds.length === 0) {
    return;
  }

  await database
    .delete(cohortCourse)
    .where(
      and(
        eq(cohortCourse.cohortId, input.cohortId),
        inArray(cohortCourse.courseId, input.courseIds),
      ),
    );

  const cohortStudentRows = await database
    .select({ userId: cohort_member.userId })
    .from(cohort_member)
    .innerJoin(member, eq(member.userId, cohort_member.userId))
    .where(
      and(
        eq(cohort_member.teamId, input.cohortId),
        eq(member.organizationId, input.organizationId),
        eq(member.role, "student"),
      ),
    );
  if (cohortStudentRows.length === 0) {
    return;
  }

  const orgCourseRows = await database
    .select({ courseId: course.id })
    .from(course)
    .where(
      and(eq(course.organizationId, input.organizationId), inArray(course.id, input.courseIds)),
    );
  if (orgCourseRows.length === 0) {
    return;
  }

  const studentUserIds = cohortStudentRows.map((row) => row.userId);
  const removedCourseIds = orgCourseRows.map((row) => row.courseId);

  await database.delete(enrollment).where(
    and(
      inArray(enrollment.userId, studentUserIds),
      inArray(enrollment.courseId, removedCourseIds),
      sql`not exists (
          select 1
          from ${cohort_member} cm
          inner join ${cohortCourse} cc on cc.cohort_id = cm.team_id
          inner join ${cohort} c on c.id = cm.team_id
          where cm.user_id = ${enrollment.userId}
            and cc.course_id = ${enrollment.courseId}
            and c.organization_id = ${input.organizationId}
        )`,
    ),
  );
}
