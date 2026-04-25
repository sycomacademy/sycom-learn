import { createMediaAsset, deleteMediaAssetByPublicId } from "@sycom/db/queries/index";
import {
  CLOUD_ROOT,
  buildAssetFolder,
  getSignedUrl,
  removeAsset,
  signUploadParams,
} from "@sycom/storage/server";
import {
  deleteAssetInputSchema,
  saveAssetInputSchema,
  signUploadInputSchema,
  signedUrlInputSchema,
  type SaveAssetInput,
  type SignUploadInput,
  type SignedUrlInput,
  type DeleteAssetInput,
} from "@sycom/storage/schemas";
import { TRPCError } from "@trpc/server";

import { protectedProcedure, router } from "../init";

export type StorageSignUploadInput = SignUploadInput;
export type StorageSaveAssetInput = SaveAssetInput;
export type StorageSignedUrlInput = SignedUrlInput;
export type StorageDeleteAssetInput = DeleteAssetInput;

export const storageRouter = router({
  signUpload: protectedProcedure.input(signUploadInputSchema).mutation(({ ctx, input }) => {
    return signUploadParams({
      folder: input.folder,
      entityType: input.entityType,
      entityId: input.entityId,
      uploaderId: ctx.session.user.id,
      uploaderEmail: ctx.session.user.email,
    });
  }),

  saveAsset: protectedProcedure.input(saveAssetInputSchema).mutation(async ({ ctx, input }) => {
    const expectedPrefix = `${buildAssetFolder(input.folder, input.entityId)}/`;
    if (!input.publicId.startsWith(expectedPrefix)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `publicId must live under ${CLOUD_ROOT}/${input.folder}/${input.entityId}/`,
      });
    }

    const row = await createMediaAsset(ctx.db, {
      publicId: input.publicId,
      secureUrl: input.secureUrl,
      name: input.name ?? null,
      format: input.format,
      bytes: input.bytes,
      width: input.width ?? null,
      height: input.height ?? null,
      folder: input.folder,
      resourceType: input.resourceType,
      entityType: input.entityType,
      entityId: input.entityId,
      tags: input.tags ?? [],
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
    const url = getSignedUrl(input.publicId, input.expireIn, {
      download: input.download,
      resourceType: input.resourceType,
    });
    return { url, expiresIn: input.expireIn };
  }),

  delete: protectedProcedure.input(deleteAssetInputSchema).mutation(async ({ ctx, input }) => {
    await removeAsset(input.publicId, {
      resourceType: input.resourceType,
      invalidate: true,
    });

    const deleted = await deleteMediaAssetByPublicId(ctx.db, {
      publicId: input.publicId,
    });

    if (!deleted) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Asset record not found",
      });
    }

    return deleted;
  }),
});
