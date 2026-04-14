import type { getTestDatabase } from "./db";
import { nanoid } from "./helpers";
import { user, organization, member, cohort, cohort_member } from "../schema/auth";
import { todo } from "../schema/todo";

type TestDatabase = ReturnType<typeof getTestDatabase>;

export const TEST_USER_ID = "test-user-00000001";
export const TEST_USER_EMAIL = "testuser@sycom.test";
export const TEST_ORG_ID = "test-org-00000001";
export const TEST_ORG_SLUG = "test-org";
export const TEST_MEMBER_ID = "test-member-00000001";
export const TEST_COHORT_ID = "test-cohort-00000001";

export async function seedTestUser(db: TestDatabase) {
  const [row] = await db
    .insert(user)
    .values({
      id: TEST_USER_ID,
      name: "Test User",
      email: TEST_USER_EMAIL,
      emailVerified: true,
    })
    .returning();
  return row!;
}

export async function seedTestOrg(db: TestDatabase) {
  const [row] = await db
    .insert(organization)
    .values({
      id: TEST_ORG_ID,
      name: "Test Organization",
      slug: TEST_ORG_SLUG,
    })
    .returning();
  return row!;
}

export async function seedTestMember(
  db: TestDatabase,
  overrides?: { role?: "owner" | "admin" | "teacher" | "student" },
) {
  const [row] = await db
    .insert(member)
    .values({
      id: TEST_MEMBER_ID,
      organizationId: TEST_ORG_ID,
      userId: TEST_USER_ID,
      role: overrides?.role ?? "owner",
    })
    .returning();
  return row!;
}

export async function seedTestCohort(db: TestDatabase) {
  const [row] = await db
    .insert(cohort)
    .values({
      id: TEST_COHORT_ID,
      name: "Test Cohort",
      organizationId: TEST_ORG_ID,
    })
    .returning();
  return row!;
}

export async function seedTestCohortMember(db: TestDatabase, userId?: string) {
  const [row] = await db
    .insert(cohort_member)
    .values({
      id: nanoid(),
      teamId: TEST_COHORT_ID,
      userId: userId ?? TEST_USER_ID,
    })
    .returning();
  return row!;
}

export async function seedTodos(db: TestDatabase, items: { text: string; completed?: boolean }[]) {
  return db
    .insert(todo)
    .values(items.map((i) => ({ text: i.text, completed: i.completed ?? false })))
    .returning();
}

export async function seedAll(db: TestDatabase) {
  const u = await seedTestUser(db);
  const org = await seedTestOrg(db);
  const mem = await seedTestMember(db);
  return { user: u, org, member: mem };
}
