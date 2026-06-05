import { getLessonWithCourseId, getMemberRole } from "@sycom/db/queries/index";
import type { Storage } from "@sycom/db/schema/storage";
import type { StorageFolder } from "@sycom/db/schema/storage";
import { TRPCError } from "@trpc/server";

import type { Context } from "../context";
import { hasPlatformPermission } from "../middleware/permissions";
import { assertPlatformOrOrgCourseRead, assertPlatformOrOrgCourseWrite } from "./org-course-access";

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
    await assertPlatformOrOrgCourseRead(ctx, lesson.courseId);
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
