import { afterEach, describe, expect, test } from "bun:test";
import { and, eq, inArray } from "drizzle-orm";
import { member, organization, user } from "@sycom/db/schema/auth";
import {
  validateAndNormalizeStudentProfileValues,
  validateOrgStudentProfileFields,
} from "@sycom/db/queries/student-profile-metadata";

import { dbEnabled, makeCaller, testDb, testUser } from "./helpers";

describe("student profile metadata — validation", () => {
  test("validateOrgStudentProfileFields rejects duplicate ids", () => {
    expect(() =>
      validateOrgStudentProfileFields([
        { id: "matric", label: "Matric", type: "text", order: 0 },
        { id: "matric", label: "Other", type: "number", order: 1 },
      ]),
    ).toThrow(/Duplicate/);
  });

  test("validateAndNormalizeStudentProfileValues enforces required text", () => {
    const fields = validateOrgStudentProfileFields([
      { id: "matric", label: "Matric number", type: "text", required: true, order: 0 },
    ]);
    expect(() => validateAndNormalizeStudentProfileValues(fields, { matric: "" })).toThrow(
      /required/i,
    );
    expect(validateAndNormalizeStudentProfileValues(fields, { matric: "  ABC123  " })).toEqual({
      matric: "ABC123",
    });
  });

  test("validateAndNormalizeStudentProfileValues coerces numbers", () => {
    const fields = validateOrgStudentProfileFields([
      { id: "year", label: "Year", type: "number", order: 0 },
    ]);
    expect(validateAndNormalizeStudentProfileValues(fields, { year: "2024" })).toEqual({
      year: 2024,
    });
    expect(() => validateAndNormalizeStudentProfileValues(fields, { year: "n/a" })).toThrow(
      /valid number/i,
    );
  });
});

describe.skipIf(!dbEnabled)("organization student profile — DB integration", () => {
  const createdUserIds: string[] = [];
  const createdOrgIds: string[] = [];

  afterEach(async () => {
    if (createdOrgIds.length) {
      await testDb.delete(member).where(inArray(member.organizationId, createdOrgIds));
      await testDb.delete(organization).where(inArray(organization.id, createdOrgIds));
      createdOrgIds.length = 0;
    }
    if (createdUserIds.length === 0) return;
    await testDb.delete(user).where(inArray(user.id, createdUserIds));
    createdUserIds.length = 0;
  });

  async function seedOrgWithRoles() {
    const owner = testUser();
    const student = testUser();
    const teacher = testUser();
    const orgId = `test-org-${crypto.randomUUID()}`;
    const studentMemberId = crypto.randomUUID();
    createdUserIds.push(owner.id, student.id, teacher.id);
    createdOrgIds.push(orgId);

    await testDb.insert(user).values([
      { id: owner.id, email: owner.email, name: owner.name, emailVerified: true },
      { id: student.id, email: student.email, name: student.name, emailVerified: true },
      { id: teacher.id, email: teacher.email, name: teacher.name, emailVerified: true },
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
        id: studentMemberId,
        organizationId: orgId,
        userId: student.id,
        role: "student",
      },
      {
        id: crypto.randomUUID(),
        organizationId: orgId,
        userId: teacher.id,
        role: "teacher",
      },
    ]);

    return { owner, student, teacher, orgId, studentMemberId };
  }

  test("teacher cannot update student profile fields", async () => {
    const { teacher, orgId } = await seedOrgWithRoles();
    const caller = makeCaller({ user: teacher, activeOrganizationId: orgId });

    await expect(
      caller.organization.updateStudentProfileFields({
        fields: [{ id: "matric", label: "Matric", type: "text", order: 0 }],
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("owner configures fields and sets student values", async () => {
    const { owner, student, orgId, studentMemberId } = await seedOrgWithRoles();
    const caller = makeCaller({ user: owner, activeOrganizationId: orgId });

    const { fields } = await caller.organization.updateStudentProfileFields({
      fields: [
        { id: "matric", label: "Matric number", type: "text", required: true, order: 0 },
        { id: "year", label: "Entry year", type: "number", order: 1 },
      ],
    });
    expect(fields).toHaveLength(2);

    const { studentProfile } = await caller.organization.updateMemberStudentProfile({
      memberId: studentMemberId,
      values: { matric: "M-100", year: 2024 },
    });
    expect(studentProfile).toEqual({ matric: "M-100", year: 2024 });

    const memberRow = await caller.organization.getMember({ memberId: studentMemberId });
    expect(memberRow.studentProfile).toEqual({ matric: "M-100", year: 2024 });
    expect(memberRow.userId).toBe(student.id);
  });

  test("cannot set student profile on non-student member", async () => {
    const { owner, teacher, orgId } = await seedOrgWithRoles();
    const [teacherMember] = await testDb
      .select({ id: member.id })
      .from(member)
      .where(and(eq(member.organizationId, orgId), eq(member.userId, teacher.id)))
      .limit(1);

    if (!teacherMember) {
      throw new Error("expected teacher member row");
    }

    const caller = makeCaller({ user: owner, activeOrganizationId: orgId });
    await caller.organization.updateStudentProfileFields({
      fields: [{ id: "matric", label: "Matric", type: "text", order: 0 }],
    });

    await expect(
      caller.organization.updateMemberStudentProfile({
        memberId: teacherMember.id,
        values: { matric: "X" },
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
