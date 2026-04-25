import { z } from "zod";

export const storageEntityTypeSchema = z.enum(["user", "course", "lesson", "organization"]);
export type StorageEntityType = z.infer<typeof storageEntityTypeSchema>;

export const storageResourceTypeSchema = z.enum(["image", "video", "audio", "file"]);
export type StorageResourceType = z.infer<typeof storageResourceTypeSchema>;

export const storageFolderSchema = z.enum([
  "avatars",
  "course_thumbnails",
  "lesson_artifacts",
  "organization_logos",
]);
export type StorageFolder = z.infer<typeof storageFolderSchema>;

export const signUploadInputSchema = z.object({
  folder: storageFolderSchema,
  entityType: storageEntityTypeSchema,
  entityId: z.string().min(1),
});
export type SignUploadInput = z.infer<typeof signUploadInputSchema>;

export const saveAssetInputSchema = z.object({
  publicId: z.string().min(1),
  secureUrl: z.string().url(),
  folder: storageFolderSchema,
  entityType: storageEntityTypeSchema,
  entityId: z.string().min(1),
  resourceType: storageResourceTypeSchema,
  format: z.string().min(1),
  bytes: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  name: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type SaveAssetInput = z.infer<typeof saveAssetInputSchema>;

export const signedUrlInputSchema = z.object({
  publicId: z.string().min(1),
  expireIn: z.number().int().positive(),
  download: z.boolean().optional(),
  resourceType: storageResourceTypeSchema.optional(),
});
export type SignedUrlInput = z.infer<typeof signedUrlInputSchema>;

export const deleteAssetInputSchema = z.object({
  publicId: z.string().min(1),
  resourceType: storageResourceTypeSchema.optional(),
});
export type DeleteAssetInput = z.infer<typeof deleteAssetInputSchema>;
