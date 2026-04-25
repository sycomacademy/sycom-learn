import type { StorageResourceType } from "./schemas";

export interface SignedUploadParams {
  uploadUrl: string;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  assetFolder: string;
  tags: string;
}

export interface UploadResult {
  secureUrl: string;
  publicId: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  resourceType: StorageResourceType;
}
