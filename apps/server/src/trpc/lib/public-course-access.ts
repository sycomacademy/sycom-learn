import type { CourseDetail } from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";

import type { Context } from "../context";

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
  detail: Pick<CourseDetail, "organizationId">,
) {
  const currentSession = requireSession(session);
  return detail.organizationId === null && currentSession.user.role === "platform_admin";
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
  detail: Pick<CourseDetail, "organizationId">,
) {
  if (!canDeletePublicCourse(session, detail)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not authorized to delete this course",
    });
  }
}
