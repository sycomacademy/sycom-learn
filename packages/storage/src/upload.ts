import type { NewStorage } from "@sycom/db/schema/storage";
import type { StorageResourceType } from "@sycom/db/schema/storage";
import type { SignedUploadParams } from "./cloudinary";

interface CloudinaryUploadResponse {
  secure_url?: string;
  public_id?: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  resource_type?: string;
  error?: { message?: string };
}

export type UploadResult = {
  secureUrl: string;
  publicId: string;
  format: NewStorage["format"];
  bytes: NewStorage["bytes"];
  width?: number;
  height?: number;
  resourceType: NewStorage["resourceType"];
};

function extensionFromName(file: Blob): string {
  const name = file instanceof File ? file.name : "";
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return "bin";
  return name.slice(dot + 1).toLowerCase();
}

function mapResourceType(type: string | undefined): StorageResourceType {
  switch (type) {
    case "image":
    case "video":
    case "audio":
      return type;
    default:
      return "file";
  }
}

export function uploadFile({
  file,
  signedParams,
  onProgress,
}: {
  file: Blob;
  signedParams: SignedUploadParams;
  onProgress?: (progress: number) => void;
}): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signedParams.apiKey);
    formData.append("timestamp", String(signedParams.timestamp));
    formData.append("signature", signedParams.signature);
    formData.append("public_id", signedParams.publicId);
    formData.append("asset_folder", signedParams.assetFolder);
    formData.append("tags", signedParams.tags);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", signedParams.uploadUrl, true);

    if (onProgress) {
      xhr.upload.addEventListener("progress", ({ loaded, total, lengthComputable }) => {
        if (lengthComputable && total > 0) {
          onProgress(Math.min(100, Math.round((loaded / total) * 100)));
        }
      });
    }

    xhr.addEventListener("load", () => {
      try {
        const data = JSON.parse(xhr.responseText) as CloudinaryUploadResponse;

        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url && data.public_id) {
          resolve({
            secureUrl: data.secure_url,
            publicId: data.public_id,
            // Cloudinary omits `format` for raw/generic files; fall back to the
            // file's extension so we never persist an empty string (saveAsset
            // requires a non-empty format and the DB column is NOT NULL).
            format: data.format || extensionFromName(file),
            bytes: data.bytes ?? 0,
            width: data.width,
            height: data.height,
            resourceType: mapResourceType(data.resource_type),
          });
        } else {
          reject(new Error(data.error?.message ?? `Cloudinary upload failed (${xhr.status})`));
        }
      } catch {
        reject(new Error("Invalid Cloudinary response"));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Cloudinary upload network error"));
    });

    xhr.send(formData);
  });
}
