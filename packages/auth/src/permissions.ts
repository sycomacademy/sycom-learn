import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc as orgBuiltInAdminAc,
  defaultStatements as orgDefaultStatements,
  memberAc as orgBuiltInMemberAc,
  ownerAc as orgBuiltInOwnerAc,
} from "better-auth/plugins/organization/access";
import {
  adminAc as platformBuiltInAdminAc,
  defaultStatements as platformDefaultStatements,
  userAc as platformBuiltInUserAc,
} from "better-auth/plugins/admin/access";

const platformStatements = {
  ...platformDefaultStatements,
  feedback: ["submit", "get", "list", "update", "delete"],
  report: ["submit", "get", "list", "update", "delete"],
} as const;

export const platformAc = createAccessControl(platformStatements);

export const platformAdminRole = platformAc.newRole({
  ...platformBuiltInAdminAc.statements,
  feedback: ["submit", "get", "list", "update", "delete"],
  report: ["submit", "get", "list", "update", "delete"],
});

export const contentCreatorRole = platformAc.newRole({
  ...platformBuiltInUserAc.statements,
  feedback: ["submit"],
  report: ["submit"],
});

export const publicStudentRole = platformAc.newRole({
  ...platformBuiltInUserAc.statements,
  feedback: ["submit"],
  report: ["submit"],
});

export const platformRoles = {
  platform_admin: platformAdminRole,
  content_creator: contentCreatorRole,
  public_student: publicStudentRole,
};

// ---------------------------------------------------------------------------
// Organization-level access control (roles *inside* an org: admin/teacher/student)
// ---------------------------------------------------------------------------
// `course` has only "assign" and "read" — orgs surface catalog courses to
// cohorts and view content, but never edit it. SOT lives on the platform side.

const orgStatements = {
  ...orgDefaultStatements,
  course: ["assign", "read"],
  enrollment: ["create", "read", "delete"],
  report: ["read"],
} as const;

export const orgAc = createAccessControl(orgStatements);

export const orgOwnerRole = orgAc.newRole({
  ...orgBuiltInOwnerAc.statements,
  course: ["assign", "read"],
  enrollment: ["create", "read", "delete"],
  report: ["read"],
});

export const orgAdminRole = orgAc.newRole({
  ...orgBuiltInAdminAc.statements,
  course: ["assign", "read"],
  enrollment: ["create", "read", "delete"],
  report: ["read"],
});

export const orgTeacherRole = orgAc.newRole({
  ...orgBuiltInMemberAc.statements,
  invitation: ["create", "cancel"],
  member: ["create"],
  course: ["assign", "read"],
  enrollment: ["create", "read", "delete"],
  report: ["read"],
});

export const orgStudentRole = orgAc.newRole({
  ...orgBuiltInMemberAc.statements,
  course: ["read"],
  enrollment: ["read"],
});

export const orgRoles = {
  owner: orgOwnerRole,
  admin: orgAdminRole,
  teacher: orgTeacherRole,
  student: orgStudentRole,
};
