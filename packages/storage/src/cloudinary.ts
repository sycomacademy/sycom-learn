import { env } from "@sycom/env/server";
import { v2 as cloudinary } from "cloudinary";

import type { StorageEntityType, StorageFolder, StorageResourceType } from "./schemas";
import type { SignedUploadParams } from "./types";

export type { SignedUploadParams, UploadResult } from "./types";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const CLOUD_ROOT = "sycom-lms";

export function buildAssetFolder(folder: StorageFolder, entityId: string): string {
  return `${CLOUD_ROOT}/${folder}/${entityId}`;
}

export function buildPublicId(
  folder: StorageFolder,
  entityId: string,
  fileId: string = crypto.randomUUID(),
): string {
  return `${buildAssetFolder(folder, entityId)}/${fileId}`;
}

// Cloudinary tags are CSV-delimited; commas in a value would split a tag.
// We sanitize defensively even though entity/user ids are safe.
function sanitizeTagValue(value: string): string {
  return value.replace(/[,\s]/g, "_");
}

export function buildTags(input: {
  entityType: StorageEntityType;
  entityId: string;
  uploaderId: string;
  uploaderEmail: string;
}): string[] {
  return [
    `entity_type:${sanitizeTagValue(input.entityType)}`,
    `entity_id:${sanitizeTagValue(input.entityId)}`,
    `uploaded_by:${sanitizeTagValue(input.uploaderId)}`,
    `uploaded_by_email:${sanitizeTagValue(input.uploaderEmail)}`,
  ];
}

export function signUploadParams(input: {
  folder: StorageFolder;
  entityType: StorageEntityType;
  entityId: string;
  uploaderId: string;
  uploaderEmail: string;
}): SignedUploadParams {
  const publicId = buildPublicId(input.folder, input.entityId);
  const assetFolder = buildAssetFolder(input.folder, input.entityId);
  const timestamp = Math.round(Date.now() / 1000);
  const tags = buildTags({
    entityType: input.entityType,
    entityId: input.entityId,
    uploaderId: input.uploaderId,
    uploaderEmail: input.uploaderEmail,
  }).join(",");

  const signature = cloudinary.utils.api_sign_request(
    { asset_folder: assetFolder, public_id: publicId, tags, timestamp },
    env.CLOUDINARY_API_SECRET,
  );

  return {
    uploadUrl: cloudinary.utils.api_url("upload", { resource_type: "auto" }),
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    publicId,
    assetFolder,
    tags,
  };
}

export async function removeAsset(
  publicId: string,
  options?: { resourceType?: StorageResourceType; invalidate?: boolean },
): Promise<{ result: string }> {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: options?.resourceType ?? "image",
    invalidate: options?.invalidate ?? true,
  });
}

export function getPublicUrl(
  publicId: string,
  resourceType: StorageResourceType = "image",
): string {
  return cloudinary.url(publicId, { resource_type: resourceType, secure: true });
}

export function getSignedUrl(
  publicId: string,
  expireIn: number,
  options?: { download?: boolean; resourceType?: StorageResourceType },
): string {
  return cloudinary.utils.private_download_url(publicId, "", {
    resource_type: options?.resourceType ?? "image",
    attachment: options?.download ?? false,
    expires_at: Math.round(Date.now() / 1000) + expireIn,
  });
}
