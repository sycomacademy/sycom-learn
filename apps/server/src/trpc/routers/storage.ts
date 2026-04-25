import { createMediaAsset, deleteMediaAssetByPublicId } from "@sycom/db/queries/index";
import {
  storageEntityTypeEnum,
  storageFolderEnum,
  storageResourceTypeEnum,
} from "@sycom/db/schema/storage";
import {
  CLOUD_ROOT,
  buildAssetFolder,
  getSignedUrl,
  removeAsset,
  signUploadParams,
} from "@sycom/storage/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../init";

const signUploadInputSchema = z.object({
  folder: z.enum(storageFolderEnum.enumValues),
  entityType: z.enum(storageEntityTypeEnum.enumValues),
  entityId: z.string().min(1),
});
type StorageSignUploadInput = z.infer<typeof signUploadInputSchema>;

const saveAssetInputSchema = z.object({
  publicId: z.string().min(1),
  secureUrl: z.url(),
  folder: z.enum(storageFolderEnum.enumValues),
  entityType: z.enum(storageEntityTypeEnum.enumValues),
  entityId: z.string().min(1),
  resourceType: z.enum(storageResourceTypeEnum.enumValues),
  tags: z.array(z.string()).optional(),
  name: z.string().optional(),
  format: z.string().min(1),
  bytes: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});
type StorageSaveAssetInput = z.infer<typeof saveAssetInputSchema>;

const signedUrlInputSchema = z.object({
  publicId: z.string().min(1),
  expireIn: z.number().int().positive(),
  download: z.boolean().optional(),
  resourceType: z.enum(storageResourceTypeEnum.enumValues).optional(),
});
type StorageSignedUrlInput = z.infer<typeof signedUrlInputSchema>;

const deleteAssetInputSchema = z.object({
  publicId: z.string().min(1),
  resourceType: z.enum(storageResourceTypeEnum.enumValues).optional(),
});
type StorageDeleteAssetInput = z.infer<typeof deleteAssetInputSchema>;

export const storageRouter = router({
  signUpload: protectedProcedure.input(signUploadInputSchema).mutation(({ ctx, input }) => {
    const mutationInput: StorageSignUploadInput = input;

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

    await removeAsset(mutationInput.publicId, {
      resourceType: mutationInput.resourceType,
      invalidate: true,
    });

    const deleted = await deleteMediaAssetByPublicId(ctx.db, {
      publicId: mutationInput.publicId,
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
