"use server";

import type { StorageFolder } from "@/packages/db/schema/storage";
import { signUploadParams } from "@/packages/storage/cloudinary";
import { saveAsset } from "@/packages/storage/queries";
import type { UploadResult } from "@/packages/storage/upload";

export async function getSignedParams(folder: StorageFolder) {
  return signUploadParams(folder, "demo");
}

export async function persistAsset(
  result: UploadResult,
  folder: StorageFolder
) {
  return saveAsset({
    publicId: result.publicId,
    secureUrl: result.secureUrl,
    folder,
    resourceType: result.resourceType,
    format: result.format,
    bytes: result.bytes,
    width: result.width,
    height: result.height,
    entityId: "demo",
    entityType: "user",
  });
}
