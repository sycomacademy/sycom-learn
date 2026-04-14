import { beforeEach, describe, expect, test } from "bun:test";

import {
  getTestDatabase,
  cleanDatabase,
  isTestDatabaseAvailable,
  seedTestUser,
  seedTestOrg,
  seedTestMember,
  seedAll,
  TEST_USER_ID,
  TEST_USER_EMAIL,
  TEST_ORG_ID,
  TEST_ORG_SLUG,
} from "../../test-utils";
import {
  getUserById,
  getUserByEmail,
  getOrganizationBySlug,
  getOrgMember,
  listOrgMembers,
} from "../../queries/auth";

const skip = !isTestDatabaseAvailable();

describe.skipIf(skip)("queries/auth", () => {
  let db: ReturnType<typeof getTestDatabase>;

  beforeEach(async () => {
    db = getTestDatabase();
    await cleanDatabase(db);
  });

  describe("getUserById", () => {
    test("returns user when found", async () => {
      await seedTestUser(db);

      const result = await getUserById(TEST_USER_ID, db);
      expect(result).toBeDefined();
      expect(result!.id).toBe(TEST_USER_ID);
      expect(result!.email).toBe(TEST_USER_EMAIL);
    });

    test("returns undefined when not found", async () => {
      const result = await getUserById("nonexistent", db);
      expect(result).toBeUndefined();
    });
  });

  describe("getUserByEmail", () => {
    test("returns user when found", async () => {
      await seedTestUser(db);

      const result = await getUserByEmail(TEST_USER_EMAIL, db);
      expect(result).toBeDefined();
      expect(result!.id).toBe(TEST_USER_ID);
    });

    test("returns undefined for unknown email", async () => {
      const result = await getUserByEmail("nobody@sycom.test", db);
      expect(result).toBeUndefined();
    });
  });

  describe("getOrganizationBySlug", () => {
    test("returns org when found", async () => {
      await seedTestOrg(db);

      const result = await getOrganizationBySlug(TEST_ORG_SLUG, db);
      expect(result).toBeDefined();
      expect(result!.id).toBe(TEST_ORG_ID);
      expect(result!.name).toBe("Test Organization");
    });

    test("returns undefined for unknown slug", async () => {
      const result = await getOrganizationBySlug("nonexistent", db);
      expect(result).toBeUndefined();
    });
  });

  describe("getOrgMember", () => {
    test("returns member when user belongs to org", async () => {
      await seedAll(db);

      const result = await getOrgMember({ organizationId: TEST_ORG_ID, userId: TEST_USER_ID }, db);
      expect(result).toBeDefined();
      expect(result!.role).toBe("owner");
    });

    test("returns undefined when user is not a member", async () => {
      await seedTestOrg(db);
      await seedTestUser(db);

      const result = await getOrgMember({ organizationId: TEST_ORG_ID, userId: TEST_USER_ID }, db);
      expect(result).toBeUndefined();
    });
  });

  describe("listOrgMembers", () => {
    test("returns all members for an org", async () => {
      await seedAll(db);

      const result = await listOrgMembers(TEST_ORG_ID, db);
      expect(result).toHaveLength(1);
      expect(result[0]!.userId).toBe(TEST_USER_ID);
    });

    test("returns empty array for org with no members", async () => {
      await seedTestOrg(db);

      const result = await listOrgMembers(TEST_ORG_ID, db);
      expect(result).toHaveLength(0);
    });
  });
});
