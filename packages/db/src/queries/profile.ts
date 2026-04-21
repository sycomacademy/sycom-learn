import { eq } from "drizzle-orm";

import type { Database } from "..";
import { profile } from "../schema/profile";

export async function getProfileByUserId(database: Database, input: { userId: string }) {
  const [row] = await database
    .select()
    .from(profile)
    .where(eq(profile.userId, input.userId))
    .limit(1);
  return row ?? null;
}
