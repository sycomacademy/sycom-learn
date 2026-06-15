import type { StorageResourceType } from "@sycom/db/schema/storage";

/**
 * Maximum upload size (bytes) per media kind. Enforced server-side as a signed
 * Cloudinary `max_file_size` (see `signUploadParams`) and mirrored in the editor
 * picker UX. Pure constants — no server-only imports — so this module is safe to
 * import from client bundles.
 *
 * Note: a single (non-chunked) Cloudinary upload request is capped at ~100 MB
 * regardless of plan, so `video` sits at that ceiling; raising it later requires
 * chunked upload.
 */
export const MEDIA_LIMITS: Record<StorageResourceType, number> = {
  image: 10 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  file: 50 * 1024 * 1024,
  video: 100 * 1024 * 1024,
};

/** Maps a browser MIME type to the storage resource kind used for limits/signing. */
export function resourceKindFromMime(mime: string): StorageResourceType {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}
