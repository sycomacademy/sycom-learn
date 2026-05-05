import { and, eq } from "drizzle-orm";

import type { Database } from "..";
import { member, user } from "../schema/auth";

/** Primary owner email for learner-facing contact (first owner row if multiple). */
export async function getOrganizationOwnerEmail(
  database: Database,
  organizationId: string,
): Promise<string | null> {
  const [row] = await database
    .select({ email: user.email })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(and(eq(member.organizationId, organizationId), eq(member.role, "owner")))
    .limit(1);

  return row?.email ?? null;
}
