import {
  type CourseDetail,
  getCourseById,
  getEnrollmentForUserCourse,
  getLessonWithCourseId,
  getMemberRole,
} from "@sycom/db/queries/index";
import type { Storage } from "@sycom/db/schema/storage";
import type { StorageFolder } from "@sycom/db/schema/storage";
import { TRPCError } from "@trpc/server";

import type { Context } from "../context";
import { hasPlatformPermission, assertPlatformPermission } from "../middleware/permissions";
import { assertCanReadPublicCourse, canReadCatalogCourse } from "./public-course-access";
import {
  assertOrgCourseStaffForDetail,
  assertPlatformOrOrgCourseRead,
  assertPlatformOrOrgCourseWrite,
} from "./org-course-access";

type StorageEntityInput = {
  entityType: string;
  entityId: string;
  folder?: StorageFolder;
};

function requireSession(session: Context["session"]) {
  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
  }
  return session;
}

export async function assertCanWriteStorageEntity(
  ctx: Context,
  input: StorageEntityInput,
): Promise<void> {
  const session = requireSession(ctx.session);

  if (input.entityType === "user") {
    if (input.folder && input.folder !== "user_avatars") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User uploads must use the user_avatars folder",
      });
    }
    if (input.entityId !== session.user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only upload assets for your own profile",
      });
    }
    return;
  }

  if (input.entityType === "course") {
    await assertPlatformOrOrgCourseWrite(ctx, input.entityId);
    return;
  }

  if (input.entityType === "lesson") {
    const lesson = await getLessonWithCourseId(ctx.db, input.entityId);
    if (!lesson) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
    }
    await assertPlatformOrOrgCourseWrite(ctx, lesson.courseId);
    return;
  }

  if (input.entityType === "organization") {
    if (input.folder !== "organization_logos") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Organization uploads must use the organization_logos folder",
      });
    }

    const activeOrganizationId = session.session.activeOrganizationId;
    if (!activeOrganizationId || activeOrganizationId !== input.entityId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Select this organization before uploading its logo",
      });
    }

    const role = await getMemberRole(ctx.db, {
      organizationId: input.entityId,
      userId: session.user.id,
    });

    if (role !== "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only an organization owner can upload its logo",
      });
    }
    return;
  }

  if (input.entityType === "feedback") {
    if (input.folder !== "feedback_reports") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Feedback uploads must use the feedback_reports folder",
      });
    }
    return;
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: "You are not authorized to manage this storage entity",
  });
}

function courseAccessPick(
  detail: Pick<CourseDetail, "organizationId" | "createdBy" | "instructors">,
) {
  return {
    organizationId: detail.organizationId,
    createdBy: detail.createdBy,
    instructors: detail.instructors,
  };
}

/** Course staff (authors) or enrolled learners on a published course. */
async function assertCanReadLessonCourseMedia(ctx: Context, courseId: string): Promise<void> {
  const session = requireSession(ctx.session);

  if (session.user.role === "platform_admin") {
    return;
  }

  const detail = await getCourseById(ctx.db, { courseId });
  if (!detail) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
  }

  if (detail.organizationId === null) {
    try {
      assertPlatformPermission(ctx.session, { course: ["read"] });
      assertCanReadPublicCourse(ctx.session, detail);
      return;
    } catch {
      // Fall through to enrollment check for learners previewing catalog courses.
    }
  } else {
    try {
      await assertOrgCourseStaffForDetail(ctx, detail);
      return;
    } catch {
      // Fall through to enrollment check for org learners.
    }
  }

  if (detail.status !== "published") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not authorized to access this asset",
    });
  }

  if (!canReadCatalogCourse(ctx.session, courseAccessPick(detail))) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not authorized to access this asset",
    });
  }

  const enrollment = await getEnrollmentForUserCourse(ctx.db, {
    courseId,
    userId: session.user.id,
  });
  if (!enrollment || enrollment.status === "dropped") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not authorized to access this asset",
    });
  }
}

export async function assertCanReadStorageEntity(
  ctx: Context,
  asset: Pick<Storage, "entityType" | "entityId" | "folder" | "uploadedBy">,
): Promise<void> {
  const session = requireSession(ctx.session);

  if (session.user.role === "platform_admin") {
    return;
  }

  if (asset.entityType === "user") {
    if (asset.entityId !== session.user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not authorized to access this asset",
      });
    }
    return;
  }

  if (asset.entityType === "course") {
    await assertPlatformOrOrgCourseRead(ctx, asset.entityId);
    return;
  }

  if (asset.entityType === "lesson") {
    const lesson = await getLessonWithCourseId(ctx.db, asset.entityId);
    if (!lesson) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
    }
    await assertCanReadLessonCourseMedia(ctx, lesson.courseId);
    return;
  }

  if (asset.entityType === "organization") {
    const role = await getMemberRole(ctx.db, {
      organizationId: asset.entityId,
      userId: session.user.id,
    });
    if (!role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not authorized to access this asset",
      });
    }
    return;
  }

  if (asset.entityType === "feedback") {
    if (
      hasPlatformPermission(ctx.session, { feedback: ["list"] }) ||
      asset.uploadedBy === session.user.id
    ) {
      return;
    }
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not authorized to access this asset",
    });
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: "You are not authorized to access this asset",
  });
}

export function assertCanOverwriteExistingAsset(
  ctx: Context,
  existing: Pick<Storage, "uploadedBy" | "entityType" | "entityId" | "folder">,
): void {
  const session = requireSession(ctx.session);

  if (existing.uploadedBy === session.user.id || session.user.role === "platform_admin") {
    return;
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: "You are not authorized to update this asset",
  });
}
