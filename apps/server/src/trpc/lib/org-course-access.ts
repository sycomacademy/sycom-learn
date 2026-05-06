import type { Database } from "@sycom/db";
import { type CourseDetail, getCourseById, getMemberRole } from "@sycom/db/queries/index";
import type { OrganizationRole } from "@sycom/db/schema/auth";
import { TRPCError } from "@trpc/server";

import type { Context } from "../context";
import { assertCanReadPublicCourse, assertCanUpdatePublicCourse } from "./public-course-access";
import { assertPlatformPermission } from "../middleware/permissions";

const ORG_COURSE_STAFF_ROLES = new Set<OrganizationRole>(["owner", "admin", "teacher"]);

type SessionCtx = Pick<Context, "db" | "session">;

export async function requireActiveOrgStaff(ctx: SessionCtx): Promise<{
  organizationId: string;
  role: OrganizationRole;
}> {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
  }

  const organizationId = ctx.session.session.activeOrganizationId;
  if (!organizationId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "No active organization" });
  }

  const role = await getMemberRole(ctx.db as Database, {
    organizationId,
    userId: ctx.session.user.id,
  });
  if (!role) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this organization" });
  }
  if (!ORG_COURSE_STAFF_ROLES.has(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not authorized to manage organization courses",
    });
  }

  return { organizationId, role };
}

export async function loadOrgCourseOrThrow(
  ctx: SessionCtx,
  courseId: string,
): Promise<CourseDetail> {
  const { organizationId } = await requireActiveOrgStaff(ctx);

  const detail = await getCourseById(ctx.db as Database, { courseId });
  if (!detail || detail.organizationId !== organizationId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
  }

  return detail;
}

export async function assertOrgCourseStaffForDetail(
  ctx: SessionCtx,
  detail: CourseDetail,
): Promise<void> {
  if (detail.organizationId === null) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
  }

  const { organizationId } = await requireActiveOrgStaff(ctx);
  if (detail.organizationId !== organizationId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
  }
}

/** Lesson / enrollment authoring: platform public courses or organization-owned courses for org staff. */
export async function assertPlatformOrOrgCourseRead(
  ctx: SessionCtx,
  courseId: string,
): Promise<CourseDetail> {
  const detail = await getCourseById(ctx.db as Database, { courseId });
  if (!detail) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
  }

  if (detail.organizationId === null) {
    assertPlatformPermission(ctx.session, { course: ["read"] });
    assertCanReadPublicCourse(ctx.session, detail);
    return detail;
  }

  await assertOrgCourseStaffForDetail(ctx, detail);
  return detail;
}

export async function assertPlatformOrOrgCourseWrite(
  ctx: SessionCtx,
  courseId: string,
): Promise<CourseDetail> {
  const detail = await getCourseById(ctx.db as Database, { courseId });
  if (!detail) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
  }

  if (detail.organizationId === null) {
    assertPlatformPermission(ctx.session, { course: ["update"] });
    assertCanUpdatePublicCourse(ctx.session, detail);
    return detail;
  }

  await assertOrgCourseStaffForDetail(ctx, detail);
  return detail;
}
