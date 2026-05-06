import { and, count, desc, eq, gte, sql } from "drizzle-orm";

import type { Database } from "..";
import { cohort, member, user, type OrganizationRole } from "../schema/auth";
import { course } from "../schema/course";
import { enrollment } from "../schema/enrollment";

export type OrgOwnerAdminOverviewTotals = {
  members: number;
  cohorts: number;
  courses: number;
  enrollments: number;
};

export type OrgOwnerAdminJoinDayRow = {
  date: string;
  total: number;
};

export type OrgOwnerAdminRecentMemberRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: OrganizationRole;
  createdAt: Date;
};

export type GetOrgOwnerAdminOverviewInput = {
  organizationId: string;
  joinDays: number;
  recentMemberLimit: number;
};

export async function getOrgOwnerAdminOverview(
  database: Database,
  input: GetOrgOwnerAdminOverviewInput,
) {
  const { organizationId, joinDays, recentMemberLimit } = input;

  const now = new Date();
  const todayUtcMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const windowStartUtc = new Date(todayUtcMidnight);
  windowStartUtc.setUTCDate(windowStartUtc.getUTCDate() - (joinDays - 1));

  const joinDayBucket = sql`date_trunc('day', ${member.createdAt} AT TIME ZONE 'UTC')::date`;

  const [membersRow, cohortsRow, coursesRow, enrollmentsRow, joinAggRows, recentMemberRows] =
    await Promise.all([
      database
        .select({ value: count() })
        .from(member)
        .where(eq(member.organizationId, organizationId)),
      database
        .select({ value: count() })
        .from(cohort)
        .where(eq(cohort.organizationId, organizationId)),
      database
        .select({ value: count() })
        .from(course)
        .where(eq(course.organizationId, organizationId)),
      database
        .select({ value: count() })
        .from(enrollment)
        .innerJoin(course, eq(enrollment.courseId, course.id))
        .where(eq(course.organizationId, organizationId)),
      database
        .select({
          dayKey: sql<string>`${joinDayBucket}::text`,
          total: sql<number>`cast(count(*) as int)`,
        })
        .from(member)
        .where(
          and(eq(member.organizationId, organizationId), gte(member.createdAt, windowStartUtc)),
        )
        .groupBy(joinDayBucket),
      database
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: member.role,
          createdAt: member.createdAt,
        })
        .from(member)
        .innerJoin(user, eq(member.userId, user.id))
        .where(eq(member.organizationId, organizationId))
        .orderBy(desc(member.createdAt))
        .limit(recentMemberLimit),
    ]);

  const joinMap = new Map(joinAggRows.map((r) => [r.dayKey, Number(r.total)]));

  const joinsByDay: OrgOwnerAdminJoinDayRow[] = [];
  for (let i = 0; i < joinDays; i++) {
    const d = new Date(windowStartUtc);
    d.setUTCDate(d.getUTCDate() + i);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;
    joinsByDay.push({ date: key, total: joinMap.get(key) ?? 0 });
  }

  return {
    totals: {
      members: membersRow[0]?.value ?? 0,
      cohorts: cohortsRow[0]?.value ?? 0,
      courses: coursesRow[0]?.value ?? 0,
      enrollments: enrollmentsRow[0]?.value ?? 0,
    } satisfies OrgOwnerAdminOverviewTotals,
    joinsByDay,
    recentMembers: recentMemberRows,
  };
}
