function getCloudName(): string {
  // oxlint-disable-next-line typescript/no-explicit-any
  const fromVite = (import.meta as any)?.env?.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
  if (fromVite) return fromVite;
  if (typeof process !== "undefined") {
    return process.env.CLOUDINARY_CLOUD_NAME ?? process.env.VITE_CLOUDINARY_CLOUD_NAME ?? "";
  }
  return "";
}

export function buildImageUrl(publicId: string): string {
  if (publicId.startsWith("http://") || publicId.startsWith("https://")) {
    return publicId;
  }
  const cloud = getCloudName();
  const id = publicId.replace(/^\/+/, "");
  return `https://res.cloudinary.com/${cloud}/image/upload/${id}`;
}
