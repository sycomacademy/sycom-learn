import {
  createMediaAsset,
  deleteMediaAssetByPublicId,
  findMediaAssetByPublicId,
  getCourseById,
  getLessonWithCourseId,
} from "@sycom/db/queries/index";
import {
  CLOUD_ROOT,
  buildAssetFolder,
  getSignedUrl,
  removeAsset,
  signUploadParams,
} from "@sycom/storage/server";
import { TRPCError } from "@trpc/server";

import { protectedProcedure, router } from "../init";
import type { Context } from "../context";
import { assertCanUpdatePublicCourse } from "../lib/public-course-access";
import {
  deleteAssetInputSchema,
  saveAssetInputSchema,
  signedUrlInputSchema,
  signUploadInputSchema,
  type StorageDeleteAssetInput,
  type StorageSaveAssetInput,
  type StorageSignUploadInput,
  type StorageSignedUrlInput,
} from "../schemas";

async function assertCanManageStorageEntity(
  ctx: Context,
  input: { entityType: string; entityId: string },
) {
  if (input.entityType === "course") {
    const detail = await getCourseById(ctx.db, { courseId: input.entityId });
    if (!detail || detail.organizationId !== null) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
    }
    assertCanUpdatePublicCourse(ctx.session, detail);
    return;
  }

  if (input.entityType === "lesson") {
    const lesson = await getLessonWithCourseId(ctx.db, input.entityId);
    if (!lesson) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
    }
    const detail = await getCourseById(ctx.db, { courseId: lesson.courseId });
    if (!detail || detail.organizationId !== null) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
    }
    assertCanUpdatePublicCourse(ctx.session, detail);
  }
}

export const storageRouter = router({
  signUpload: protectedProcedure.input(signUploadInputSchema).mutation(async ({ ctx, input }) => {
    const mutationInput: StorageSignUploadInput = input;

    await assertCanManageStorageEntity(ctx, mutationInput);

    return signUploadParams({
      folder: mutationInput.folder,
      entityType: mutationInput.entityType,
      entityId: mutationInput.entityId,
      uploaderId: ctx.session.user.id,
      uploaderEmail: ctx.session.user.email,
    });
  }),

  saveAsset: protectedProcedure.input(saveAssetInputSchema).mutation(async ({ ctx, input }) => {
    const mutationInput: StorageSaveAssetInput = input;
    const expectedPrefix = `${buildAssetFolder(mutationInput.folder, mutationInput.entityId)}/`;

    await assertCanManageStorageEntity(ctx, mutationInput);

    if (!mutationInput.publicId.startsWith(expectedPrefix)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `publicId must live under ${CLOUD_ROOT}/${mutationInput.folder}/${mutationInput.entityId}/`,
      });
    }

    const row = await createMediaAsset(ctx.db, {
      publicId: mutationInput.publicId,
      secureUrl: mutationInput.secureUrl,
      name: mutationInput.name ?? null,
      format: mutationInput.format,
      bytes: mutationInput.bytes,
      width: mutationInput.width ?? null,
      height: mutationInput.height ?? null,
      folder: mutationInput.folder,
      resourceType: mutationInput.resourceType,
      entityType: mutationInput.entityType,
      entityId: mutationInput.entityId,
      tags: mutationInput.tags ?? [],
      uploadedBy: ctx.session.user.id,
      uploaderEmail: ctx.session.user.email,
    });

    if (!row) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to record storage entry",
      });
    }

    return row;
  }),

  getSignedDownloadUrl: protectedProcedure.input(signedUrlInputSchema).query(({ input }) => {
    const queryInput: StorageSignedUrlInput = input;
    const url = getSignedUrl(queryInput.publicId, queryInput.expireIn, {
      download: queryInput.download,
      resourceType: queryInput.resourceType,
    });
    return { url, expiresIn: queryInput.expireIn };
  }),

  delete: protectedProcedure.input(deleteAssetInputSchema).mutation(async ({ ctx, input }) => {
    const mutationInput: StorageDeleteAssetInput = input;
    const asset = await findMediaAssetByPublicId(ctx.db, { publicId: mutationInput.publicId });
    if (!asset) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Asset record not found",
      });
    }

    await assertCanManageStorageEntity(ctx, asset);

    await removeAsset(mutationInput.publicId, {
      resourceType: mutationInput.resourceType,
      invalidate: true,
    });

    const deleted = await deleteMediaAssetByPublicId(ctx.db, {
      publicId: mutationInput.publicId,
    });

    if (!deleted) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Asset record not found" });
    }

    return deleted;
  }),
});
