import { afterEach, describe, expect, test } from "bun:test";
import { eq, inArray } from "drizzle-orm";
import { profile } from "@sycom/db/schema/profile";
import { user } from "@sycom/db/schema/auth";

import { dbEnabled, makeCaller, testDb, testUser } from "./helpers";

// ---------------------------------------------------------------------------
// Pure middleware test (no DB required)
// ---------------------------------------------------------------------------

describe("profile.get — auth middleware", () => {
  test("throws UNAUTHORIZED when ctx.session is null", async () => {
    const caller = makeCaller({ user: null });
    try {
      await caller.profile.get();
      throw new Error("expected caller.profile.get() to throw");
    } catch (err) {
      const e = err as { code?: string; message?: string };
      expect(e.code).toBe("UNAUTHORIZED");
      expect(e.message).toBe("Authentication required");
    }
  });
});

// ---------------------------------------------------------------------------
// DB-backed integration tests
//
// Gated on TEST_DATABASE_URL so we never write to the dev DB by accident.
// To run these tests:
//   export TEST_DATABASE_URL='postgresql://...'
//   bun run -F server test
//
// TEST_DATABASE_URL should point at a database that has `bun run db:migrate`
// applied. Tests clean up after themselves by id, so they're safe to run
// repeatedly on the same database.
// ---------------------------------------------------------------------------

describe.skipIf(!dbEnabled)("profile.get — DB integration", () => {
  const createdUserIds: string[] = [];

  afterEach(async () => {
    if (createdUserIds.length === 0) return;
    // profile has ON DELETE CASCADE on user_id, so deleting users clears both.
    await testDb.delete(profile).where(inArray(profile.userId, createdUserIds));
    await testDb.delete(user).where(inArray(user.id, createdUserIds));
    createdUserIds.length = 0;
  });

  test("returns session + user + profile for an authenticated user", async () => {
    const u = testUser();
    createdUserIds.push(u.id);

    await testDb.insert(user).values({
      id: u.id,
      email: u.email,
      name: u.name,
      emailVerified: true,
    });
    await testDb.insert(profile).values({ userId: u.id });

    const caller = makeCaller({ user: u });
    const result = await caller.profile.get();

    expect(result.user.id).toBe(u.id);
    expect(result.user.email).toBe(u.email);
    expect(result.profile?.userId).toBe(u.id);
    expect(result.session.userId).toBe(u.id);
  });

  test("returns profile: null when the user has no profile row yet", async () => {
    // Regression guard for the databaseHooks.user.create.after hook in
    // packages/auth/src/index.ts: if that hook goes away, getProfileByUserId
    // must still return null (not throw).
    const u = testUser();
    createdUserIds.push(u.id);

    await testDb.insert(user).values({
      id: u.id,
      email: u.email,
      name: u.name,
      emailVerified: true,
    });
    // intentionally no profile insert

    const caller = makeCaller({ user: u });
    const result = await caller.profile.get();

    expect(result.user.id).toBe(u.id);
    expect(result.profile).toBeNull();
  });

  test("only returns the profile belonging to the authenticated user", async () => {
    // Two users, two profiles. Make sure calling as user A never returns
    // user B's profile row.
    const a = testUser();
    const b = testUser();
    createdUserIds.push(a.id, b.id);

    await testDb.insert(user).values([
      { id: a.id, email: a.email, name: a.name, emailVerified: true },
      { id: b.id, email: b.email, name: b.name, emailVerified: true },
    ]);
    await testDb.insert(profile).values([
      { userId: a.id, bio: "A's bio" },
      { userId: b.id, bio: "B's bio" },
    ]);

    const callerA = makeCaller({ user: a });
    const resultA = await callerA.profile.get();

    expect(resultA.user.id).toBe(a.id);
    expect(resultA.profile?.userId).toBe(a.id);
    expect(resultA.profile?.bio).toBe("A's bio");

    // Sanity: B's row still exists and is not leaked.
    const [bRow] = await testDb.select().from(profile).where(eq(profile.userId, b.id)).limit(1);
    expect(bRow?.bio).toBe("B's bio");
  });
});
