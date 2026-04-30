import { and, count, desc, eq, gt, gte, sql } from "drizzle-orm";

import type { Database } from "..";
import { invitation, organization, platform_invitation, user, type UserRole } from "../schema/auth";
import { feedbackReport } from "../schema/feedback";

export type AdminDashboardOverviewTotals = {
  users: number;
  organizations: number;
  activeInvites: number;
  pendingReports: number;
};

export type AdminDashboardSignupDayRow = {
  date: string;
  total: number;
};

export type AdminDashboardRecentUserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole | null;
  createdAt: Date;
};

export type GetAdminDashboardOverviewInput = {
  signupDays: number;
  recentUserLimit: number;
};

/** Platform + org invitations that are still pending and not past `expires_at`. */
function activeInviteCounts(database: Database, now: Date) {
  return Promise.all([
    database
      .select({ value: count() })
      .from(platform_invitation)
      .where(
        and(eq(platform_invitation.status, "pending"), gt(platform_invitation.expiresAt, now)),
      ),
    database
      .select({ value: count() })
      .from(invitation)
      .where(and(eq(invitation.status, "pending"), gt(invitation.expiresAt, now))),
  ]);
}

export async function getAdminDashboardOverview(
  database: Database,
  input: GetAdminDashboardOverviewInput,
) {
  const now = new Date();
  const { signupDays, recentUserLimit } = input;

  const todayUtcMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const windowStartUtc = new Date(todayUtcMidnight);
  windowStartUtc.setUTCDate(windowStartUtc.getUTCDate() - (signupDays - 1));

  const signupDayBucket = sql`date_trunc('day', ${user.createdAt} AT TIME ZONE 'UTC')::date`;

  const [
    userCountRow,
    orgCountRow,
    [platformInviteRow, orgInviteRow],
    pendingReportsRow,
    signupAggRows,
    recentUserRows,
  ] = await Promise.all([
    database.select({ value: count() }).from(user),
    database.select({ value: count() }).from(organization),
    activeInviteCounts(database, now),
    database
      .select({ value: count() })
      .from(feedbackReport)
      .where(eq(feedbackReport.status, "pending")),
    database
      .select({
        dayKey: sql<string>`${signupDayBucket}::text`,
        total: sql<number>`cast(count(*) as int)`,
      })
      .from(user)
      .where(gte(user.createdAt, windowStartUtc))
      .groupBy(signupDayBucket),
    database
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(recentUserLimit),
  ]);

  const signupMap = new Map(signupAggRows.map((r) => [r.dayKey, Number(r.total)]));

  const signupsByDay: AdminDashboardSignupDayRow[] = [];
  for (let i = 0; i < signupDays; i++) {
    const d = new Date(windowStartUtc);
    d.setUTCDate(d.getUTCDate() + i);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;
    signupsByDay.push({ date: key, total: signupMap.get(key) ?? 0 });
  }

  return {
    totals: {
      users: userCountRow[0]?.value ?? 0,
      organizations: orgCountRow[0]?.value ?? 0,
      activeInvites: (platformInviteRow[0]?.value ?? 0) + (orgInviteRow[0]?.value ?? 0),
      pendingReports: pendingReportsRow[0]?.value ?? 0,
    },
    signupsByDay,
    recentUsers: recentUserRows,
  };
}
