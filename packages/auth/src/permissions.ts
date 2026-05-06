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
  feedback: ["submit", "list", "update"],
  report: ["submit", "list", "update"],
  organization: ["create", "read", "update", "delete"],
  course: ["create", "list", "read", "update", "delete", "seed", "generate"],
  audit: ["read"],
} as const;

export const platformAc = createAccessControl(platformStatements);

export const platformAdminRole = platformAc.newRole({
  ...platformBuiltInAdminAc.statements,
  feedback: ["submit", "list", "update"],
  report: ["submit", "list", "update"],
  organization: ["create", "read", "update", "delete"],
  course: ["create", "list", "read", "update", "delete", "seed", "generate"],
  audit: ["read"],
});

export const contentCreatorRole = platformAc.newRole({
  ...platformBuiltInUserAc.statements,
  feedback: ["submit"],
  report: ["submit"],
  course: ["create", "list", "read", "update", "delete", "generate"],
});

export const publicStudentRole = platformAc.newRole({
  ...platformBuiltInUserAc.statements,
  feedback: ["submit"],
  report: ["submit"],
  course: ["list", "read"],
});

export const platformRoles = {
  platform_admin: platformAdminRole,
  content_creator: contentCreatorRole,
  public_student: publicStudentRole,
};

// ---------------------------------------------------------------------------
// Organization-level access control (roles *inside* an org: admin/teacher/student)
// ---------------------------------------------------------------------------
// Courses are dual-scope: an org can author its own courses *and* receive
// platform-seeded forks. Owner/admin manage all org courses; teachers can
// only see/edit courses they're listed on (filtering happens at the query
// layer via the course_instructor join — ACL only encodes the verb set).
// `assign` here means assigning a course to a cohort within the org;
// platform→org seeding is the platform-scoped `course: seed` permission.

const orgStatements = {
  ...orgDefaultStatements,
  course: ["create", "read", "update", "delete", "assign"],
  enrollment: ["create", "read", "delete"],
  report: ["read"],
} as const;

export const orgAc = createAccessControl(orgStatements);

export const orgOwnerRole = orgAc.newRole({
  ...orgBuiltInOwnerAc.statements,
  course: ["create", "read", "update", "delete", "assign"],
  enrollment: ["create", "read", "delete"],
  report: ["read"],
});

export const orgAdminRole = orgAc.newRole({
  ...orgBuiltInAdminAc.statements,
  course: ["create", "read", "update", "delete", "assign"],
  enrollment: ["create", "read", "delete"],
  report: ["read"],
});

export const orgTeacherRole = orgAc.newRole({
  ...orgBuiltInMemberAc.statements,
  invitation: ["create", "cancel"],
  member: ["create"],
  course: ["read", "update"],
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
