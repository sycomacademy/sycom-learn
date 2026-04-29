import { describe, expect, test } from "bun:test";

import {
  contentCreatorRole,
  orgAdminRole,
  orgOwnerRole,
  orgRoles,
  orgStudentRole,
  orgTeacherRole,
  platformAdminRole,
  platformRoles,
  publicStudentRole,
} from "./permissions";

// Helper: the statements on a role are a partial subset of the access-control
// statements. We assert on explicit resource/action arrays so that additive
// permission changes fail loudly.
const stmts = (role: { statements: Record<string, readonly string[]> }) =>
  role.statements as Record<string, readonly string[] | undefined>;

describe("platform roles — platform_admin", () => {
  test("can fully manage feedback", () => {
    expect([...(stmts(platformAdminRole).feedback ?? [])].sort()).toEqual(
      ["submit", "get", "list", "update"].sort(),
    );
  });

  test("can fully manage reports", () => {
    expect([...(stmts(platformAdminRole).report ?? [])].sort()).toEqual(
      ["submit", "get", "list", "update"].sort(),
    );
  });
});

describe("platform roles — content_creator", () => {
  test("can submit feedback", () => {
    expect(stmts(contentCreatorRole).feedback).toEqual(["submit"]);
  });

  test("can submit reports", () => {
    expect(stmts(contentCreatorRole).report).toEqual(["submit"]);
  });
});

describe("platform roles — public_student", () => {
  test("can submit feedback", () => {
    expect(stmts(publicStudentRole).feedback).toEqual(["submit"]);
  });

  test("can submit reports", () => {
    expect(stmts(publicStudentRole).report).toEqual(["submit"]);
  });

  test("cannot access admin report actions", () => {
    const reportActions = stmts(publicStudentRole).report ?? [];
    for (const forbidden of ["get", "list", "update"]) {
      expect(reportActions).not.toContain(forbidden);
    }
  });
});

describe("platformRoles map", () => {
  test("exposes the three expected keys", () => {
    expect(Object.keys(platformRoles).sort()).toEqual(
      ["platform_admin", "content_creator", "public_student"].sort(),
    );
  });
});

// ---------------------------------------------------------------------------
// Org roles
// ---------------------------------------------------------------------------

describe("org roles — architectural invariant", () => {
  // Enforces the comment at the top of permissions.ts: orgs surface catalog
  // courses to cohorts and view content, but never edit it. SOT lives on the
  // platform side.
  const allOrgRoles = [
    ["owner", orgOwnerRole],
    ["admin", orgAdminRole],
    ["teacher", orgTeacherRole],
    ["student", orgStudentRole],
  ] as const;

  for (const [name, role] of allOrgRoles) {
    test(`${name} cannot mutate courses`, () => {
      const courseActions = stmts(role).course ?? [];
      for (const forbidden of ["create", "update", "delete", "publish"]) {
        expect(courseActions).not.toContain(forbidden);
      }
    });
  }
});

describe("org roles — owner/admin/teacher shared capabilities", () => {
  const managerRoles = [
    ["owner", orgOwnerRole],
    ["admin", orgAdminRole],
    ["teacher", orgTeacherRole],
  ] as const;

  for (const [name, role] of managerRoles) {
    test(`${name} can assign+read courses`, () => {
      expect([...(stmts(role).course ?? [])].sort()).toEqual(["assign", "read"].sort());
    });

    test(`${name} can fully manage enrollments`, () => {
      expect([...(stmts(role).enrollment ?? [])].sort()).toEqual(
        ["create", "delete", "read"].sort(),
      );
    });

    test(`${name} can read reports`, () => {
      expect(stmts(role).report).toEqual(["read"]);
    });
  }
});

describe("org roles — teacher (invitation + member create)", () => {
  test("teacher can create/cancel invitations", () => {
    expect([...(stmts(orgTeacherRole).invitation ?? [])].sort()).toEqual(
      ["cancel", "create"].sort(),
    );
  });

  test("teacher can create members", () => {
    expect(stmts(orgTeacherRole).member).toEqual(["create"]);
  });
});

describe("org roles — student", () => {
  test("can only read courses", () => {
    expect(stmts(orgStudentRole).course).toEqual(["read"]);
  });

  test("can only read enrollments (no create/delete)", () => {
    expect(stmts(orgStudentRole).enrollment).toEqual(["read"]);
  });

  test("cannot read reports", () => {
    expect(stmts(orgStudentRole).report).toBeUndefined();
  });

  test("cannot create invitations or members", () => {
    // Inherited from the built-in org member AC as empty arrays — no actions
    // means no permissions. Either undefined or [] both encode "no access".
    expect(stmts(orgStudentRole).invitation ?? []).toEqual([]);
    expect(stmts(orgStudentRole).member ?? []).toEqual([]);
  });
});

describe("orgRoles map", () => {
  test("exposes the four expected keys", () => {
    expect(Object.keys(orgRoles).sort()).toEqual(["admin", "owner", "student", "teacher"].sort());
  });
});

// ---------------------------------------------------------------------------
// Spot-check the runtime authorize() behaviour on the public_student role.
// This ensures the Better Auth integration (not just our statement shape)
// behaves the way we expect.
// ---------------------------------------------------------------------------

describe("authorize() integration", () => {
  test("public_student authorize({ report: ['submit'] }) succeeds", () => {
    expect(publicStudentRole.authorize({ report: ["submit"] }).success).toBe(true);
  });

  test("public_student authorize({ feedback: ['submit'] }) succeeds", () => {
    expect(publicStudentRole.authorize({ feedback: ["submit"] }).success).toBe(true);
  });

  test("public_student authorize({ report: ['update'] }) fails", () => {
    const result = publicStudentRole.authorize({
      report: ["update"],
    } as unknown as Parameters<typeof publicStudentRole.authorize>[0]);
    expect(result.success).toBe(false);
  });

  test("org student authorize({ enrollment: ['delete'] }) fails", () => {
    const result = orgStudentRole.authorize({
      enrollment: ["delete"],
    } as unknown as Parameters<typeof orgStudentRole.authorize>[0]);
    expect(result.success).toBe(false);
  });
});
