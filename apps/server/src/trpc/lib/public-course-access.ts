import type { CourseDetail } from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";

import type { Context } from "../context";
import type { EnrollmentAccessSource } from "@sycom/db/schema/enrollment";

function requireSession(session: Context["session"]) {
  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
  }

  return session;
}

function isAssignedContentCreator(
  detail: Pick<CourseDetail, "createdBy" | "instructors">,
  userId: string,
) {
  return (
    detail.createdBy === userId ||
    detail.instructors.some((instructor) => instructor.userId === userId)
  );
}

export type CatalogEnrollClassification =
  | { kind: "requires_payment" }
  | { kind: "allowed"; accessSource: EnrollmentAccessSource };

/** How `catalog.enroll` / platform `enrollment.enroll` should record access after {@link assertCanReadCatalogCourse} or {@link assertCanReadPublicCourse}. */
export function classifyCatalogEnrollAccess(
  session: Context["session"],
  detail: Pick<CourseDetail, "organizationId" | "createdBy" | "instructors">,
): CatalogEnrollClassification {
  const currentSession = requireSession(session);

  if (detail.organizationId !== null) {
    return { kind: "allowed", accessSource: "org_grant" };
  }

  switch (currentSession.user.role) {
    case "platform_admin":
      return { kind: "allowed", accessSource: "free" };
    case "content_creator":
      if (isAssignedContentCreator(detail, currentSession.user.id)) {
        return { kind: "allowed", accessSource: "free" };
      }
      return { kind: "requires_payment" };
    case "public_student":
      return { kind: "requires_payment" };
    default:
      return { kind: "requires_payment" };
  }
}

export function canReadPublicCourse(
  session: Context["session"],
  detail: Pick<CourseDetail, "createdBy" | "instructors" | "organizationId">,
) {
  const currentSession = requireSession(session);
  if (detail.organizationId !== null) {
    return false;
  }

  switch (currentSession.user.role) {
    case "platform_admin":
      return true;
    case "public_student":
      // Keep this branch isolated so future payment gating can replace it cleanly.
      return true;
    case "content_creator":
      return isAssignedContentCreator(detail, currentSession.user.id);
    default:
      return false;
  }
}

/** Published courses: platform visibility via {@link canReadPublicCourse}, or org match on active org. */
export function canReadCatalogCourse(
  session: Context["session"],
  detail: Pick<CourseDetail, "organizationId" | "createdBy" | "instructors">,
) {
  const currentSession = requireSession(session);

  if (detail.organizationId === null) {
    return canReadPublicCourse(session, detail);
  }

  if (currentSession.user.role === "platform_admin") {
    return true;
  }

  const activeOrgId = currentSession.session.activeOrganizationId;
  if (activeOrgId != null && activeOrgId === detail.organizationId) {
    return true;
  }

  return false;
}

export function canUpdatePublicCourse(
  session: Context["session"],
  detail: Pick<CourseDetail, "createdBy" | "instructors" | "organizationId">,
) {
  const currentSession = requireSession(session);
  if (detail.organizationId !== null) {
    return false;
  }

  if (currentSession.user.role === "platform_admin") {
    return true;
  }

  if (currentSession.user.role === "content_creator") {
    return isAssignedContentCreator(detail, currentSession.user.id);
  }

  return false;
}

export function canDeletePublicCourse(
  session: Context["session"],
  detail: Pick<CourseDetail, "organizationId" | "createdBy" | "instructors">,
) {
  const currentSession = requireSession(session);
  if (detail.organizationId !== null) {
    return false;
  }

  switch (currentSession.user.role) {
    case "platform_admin":
      return true;
    case "content_creator": {
      const userId = currentSession.user.id;
      if (detail.createdBy === userId) {
        return true;
      }
      return detail.instructors.some((i) => i.userId === userId && i.role === "main");
    }
    default:
      return false;
  }
}

export function assertCanReadPublicCourse(
  session: Context["session"],
  detail: Pick<CourseDetail, "createdBy" | "instructors" | "organizationId">,
) {
  if (!canReadPublicCourse(session, detail)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not authorized to access this course",
    });
  }
}

export function assertCanReadCatalogCourse(
  session: Context["session"],
  detail: Pick<CourseDetail, "organizationId" | "createdBy" | "instructors">,
) {
  if (!canReadCatalogCourse(session, detail)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not authorized to access this course",
    });
  }
}

export function assertCanUpdatePublicCourse(
  session: Context["session"],
  detail: Pick<CourseDetail, "createdBy" | "instructors" | "organizationId">,
) {
  if (!canUpdatePublicCourse(session, detail)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not authorized to modify this course",
    });
  }
}

export function assertCanDeletePublicCourse(
  session: Context["session"],
  detail: Pick<CourseDetail, "organizationId" | "createdBy" | "instructors">,
) {
  if (!canDeletePublicCourse(session, detail)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not authorized to delete this course",
    });
  }
}
