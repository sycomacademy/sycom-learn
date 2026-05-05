import { afterEach, describe, expect, test } from "bun:test";
import { eq, inArray } from "drizzle-orm";
import { member, organization, user } from "@sycom/db/schema/auth";
import { profile } from "@sycom/db/schema/profile";

import { dbEnabled, makeCaller, testDb, testUser } from "./helpers";

describe("onboarding — auth middleware", () => {
  test("onboarding.status throws UNAUTHORIZED when unauthenticated", async () => {
    const caller = makeCaller({ user: null });
    try {
      await caller.onboarding.status();
      throw new Error("expected onboarding.status to throw");
    } catch (err) {
      const e = err as { code?: string };
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });

  test("onboarding.completeOrganization throws UNAUTHORIZED when unauthenticated", async () => {
    const caller = makeCaller({ user: null });
    try {
      await caller.onboarding.completeOrganization({});
      throw new Error("expected completeOrganization to throw");
    } catch (err) {
      const e = err as { code?: string };
      expect(e.code).toBe("UNAUTHORIZED");
    }
  });
});

describe.skipIf(!dbEnabled)("onboarding.completeOrganization — DB integration", () => {
  const createdUserIds: string[] = [];
  const createdOrgIds: string[] = [];

  afterEach(async () => {
    if (createdOrgIds.length) {
      await testDb.delete(member).where(inArray(member.organizationId, createdOrgIds));
      await testDb.delete(organization).where(inArray(organization.id, createdOrgIds));
      createdOrgIds.length = 0;
    }
    if (createdUserIds.length === 0) return;
    await testDb.delete(profile).where(inArray(profile.userId, createdUserIds));
    await testDb.delete(user).where(inArray(user.id, createdUserIds));
    createdUserIds.length = 0;
  });

  test("throws FORBIDDEN when session user is not org owner", async () => {
    const owner = testUser();
    const student = testUser();
    const orgId = `test-org-${crypto.randomUUID()}`;
    createdUserIds.push(owner.id, student.id);
    createdOrgIds.push(orgId);

    await testDb.insert(user).values([
      { id: owner.id, email: owner.email, name: owner.name, emailVerified: true },
      { id: student.id, email: student.email, name: student.name, emailVerified: true },
    ]);
    await testDb.insert(organization).values({
      id: orgId,
      name: "Test Org",
      slug: `test-org-${crypto.randomUUID().slice(0, 8)}`,
    });
    await testDb.insert(member).values([
      {
        id: crypto.randomUUID(),
        organizationId: orgId,
        userId: owner.id,
        role: "owner",
      },
      {
        id: crypto.randomUUID(),
        organizationId: orgId,
        userId: student.id,
        role: "student",
      },
    ]);
    await testDb.insert(profile).values({
      userId: student.id,
      onboardedAt: new Date(),
    });

    const caller = makeCaller({
      user: student,
      activeOrganizationId: orgId,
    });

    try {
      await caller.onboarding.completeOrganization({});
      throw new Error("expected FORBIDDEN");
    } catch (err) {
      const e = err as { code?: string; message?: string };
      expect(e.code).toBe("FORBIDDEN");
      expect(e.message).toContain("owner");
    }
  });

  test("owner sets organization onboarded_at", async () => {
    const u = testUser();
    const orgId = `test-org-${crypto.randomUUID()}`;
    createdUserIds.push(u.id);
    createdOrgIds.push(orgId);

    await testDb.insert(user).values({
      id: u.id,
      email: u.email,
      name: u.name,
      emailVerified: true,
    });
    await testDb.insert(organization).values({
      id: orgId,
      name: "Owner Org",
      slug: `own-${crypto.randomUUID().slice(0, 8)}`,
    });
    await testDb.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId: u.id,
      role: "owner",
    });
    await testDb.insert(profile).values({
      userId: u.id,
      onboardedAt: new Date(),
    });

    const caller = makeCaller({
      user: u,
      activeOrganizationId: orgId,
    });

    const first = await caller.onboarding.completeOrganization({});
    expect(first.alreadyComplete).toBe(false);

    const [row] = await testDb
      .select({ onboardedAt: organization.onboardedAt, metadata: organization.metadata })
      .from(organization)
      .where(eq(organization.id, orgId))
      .limit(1);
    expect(row?.onboardedAt).not.toBeNull();
    expect(JSON.parse(row?.metadata ?? "{}").accentHex).toMatch(/^#/);

    const second = await caller.onboarding.completeOrganization({});
    expect(second.alreadyComplete).toBe(true);
  });

  test("skipRemaining sets onboarded_at without branding metadata", async () => {
    const u = testUser();
    const orgId = `test-org-${crypto.randomUUID()}`;
    createdUserIds.push(u.id);
    createdOrgIds.push(orgId);

    await testDb.insert(user).values({
      id: u.id,
      email: u.email,
      name: u.name,
      emailVerified: true,
    });
    await testDb.insert(organization).values({
      id: orgId,
      name: "Skip Org",
      slug: `skip-${crypto.randomUUID().slice(0, 8)}`,
    });
    await testDb.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId: u.id,
      role: "owner",
    });
    await testDb.insert(profile).values({
      userId: u.id,
      onboardedAt: new Date(),
    });

    const caller = makeCaller({
      user: u,
      activeOrganizationId: orgId,
    });

    await caller.onboarding.completeOrganization({ skipRemaining: true });

    const [row] = await testDb
      .select({ onboardedAt: organization.onboardedAt, metadata: organization.metadata })
      .from(organization)
      .where(eq(organization.id, orgId))
      .limit(1);
    expect(row?.onboardedAt).not.toBeNull();
    expect(row?.metadata).toBeNull();
  });
});
