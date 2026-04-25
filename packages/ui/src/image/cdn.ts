import { Cloudinary } from "@cloudinary/url-gen";

function getViteCloudName(): string | undefined {
  try {
    return import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  } catch {
    return undefined;
  }
}

function getCloudName(): string {
  const fromVite = getViteCloudName();
  if (fromVite) return fromVite;

  if (typeof process !== "undefined") {
    const fromProcess = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (fromProcess) return fromProcess;
  }

  throw new Error(
    "Missing Cloudinary cloud name. Set VITE_CLOUDINARY_CLOUD_NAME (web) or CLOUDINARY_CLOUD_NAME (server).",
  );
}

export function buildImageUrl(publicId: string): string {
  if (
    publicId.startsWith("http://") ||
    publicId.startsWith("https://") ||
    publicId.startsWith("/") ||
    publicId.startsWith("./") ||
    publicId.startsWith("../") ||
    publicId.startsWith("data:") ||
    publicId.startsWith("blob:")
  ) {
    return publicId;
  }

  const id = publicId.replace(/^\/+/, "");
  const cld = new Cloudinary({
    cloud: { cloudName: getCloudName() },
    url: { analytics: false, secure: true },
  });
  const image = cld.image(id);

  image.format("auto");
  image.quality("auto");

  return image.toURL();
}
