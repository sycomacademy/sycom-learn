import { eq } from "drizzle-orm";

import type { Database } from "..";
import { profile, type ProfileSettings } from "../schema/profile";

export async function getProfileByUserId(database: Database, input: { userId: string }) {
  const [row] = await database
    .select()
    .from(profile)
    .where(eq(profile.userId, input.userId))
    .limit(1);
  return row ?? null;
}

export async function upsertProfileByUserId(
  database: Database,
  input: {
    userId: string;
    onboardedAt?: Date | null;
    bio?: string | null;
    settings?: ProfileSettings | null;
  },
) {
  const { userId, ...patch } = input;

  const [row] = await database
    .insert(profile)
    .values({
      userId,
      ...patch,
    })
    .onConflictDoUpdate({
      target: profile.userId,
      set: patch,
    })
    .returning();

  return row ?? null;
}
