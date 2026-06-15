import {
  createMediaAsset,
  deleteMediaAssetByPublicId,
  findMediaAssetByPublicId,
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
import {
  assertCanOverwriteExistingAsset,
  assertCanReadStorageEntity,
  assertCanWriteStorageEntity,
} from "../lib/storage-access";
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

const MAX_SIGNED_URL_EXPIRE_SECONDS = 300;

export const storageRouter = router({
  signUpload: protectedProcedure.input(signUploadInputSchema).mutation(async ({ ctx, input }) => {
    const mutationInput: StorageSignUploadInput = input;

    await assertCanWriteStorageEntity(ctx, mutationInput);

    return signUploadParams({
      folder: mutationInput.folder,
      entityType: mutationInput.entityType,
      entityId: mutationInput.entityId,
      resourceType: mutationInput.resourceType,
      uploaderId: ctx.session.user.id,
      uploaderEmail: ctx.session.user.email,
    });
  }),

  saveAsset: protectedProcedure.input(saveAssetInputSchema).mutation(async ({ ctx, input }) => {
    const mutationInput: StorageSaveAssetInput = input;
    const expectedPrefix = `${buildAssetFolder(mutationInput.folder, mutationInput.entityId)}/`;

    await assertCanWriteStorageEntity(ctx, mutationInput);

    if (!mutationInput.publicId.startsWith(expectedPrefix)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `publicId must live under ${CLOUD_ROOT}/${mutationInput.folder}/${mutationInput.entityId}/`,
      });
    }

    const existing = await findMediaAssetByPublicId(ctx.db, {
      publicId: mutationInput.publicId,
    });
    if (existing) {
      await assertCanWriteStorageEntity(ctx, {
        entityType: existing.entityType,
        entityId: existing.entityId,
        folder: existing.folder,
      });
      assertCanOverwriteExistingAsset(ctx, existing);
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

  getSignedDownloadUrl: protectedProcedure
    .input(signedUrlInputSchema)
    .query(async ({ ctx, input }) => {
      const queryInput: StorageSignedUrlInput = input;
      const asset = await findMediaAssetByPublicId(ctx.db, {
        publicId: queryInput.publicId,
      });

      if (!asset) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Asset record not found",
        });
      }

      await assertCanReadStorageEntity(ctx, asset);

      const expiresIn = Math.min(queryInput.expireIn, MAX_SIGNED_URL_EXPIRE_SECONDS);
      const url = getSignedUrl(asset.publicId, expiresIn, {
        download: queryInput.download,
        resourceType: asset.resourceType,
      });

      return { url, expiresIn };
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

    await assertCanWriteStorageEntity(ctx, {
      entityType: asset.entityType,
      entityId: asset.entityId,
      folder: asset.folder,
    });

    await removeAsset(asset.publicId, {
      resourceType: mutationInput.resourceType ?? asset.resourceType,
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
