import { Cloudinary } from "@cloudinary/url-gen";

type ImportMetaEnvLike = { VITE_CLOUDINARY_CLOUD_NAME?: string };
type ImportMetaLike = ImportMeta & { env?: ImportMetaEnvLike };

function getCloudName(): string {
  const fromVite = (import.meta as ImportMetaLike)?.env?.VITE_CLOUDINARY_CLOUD_NAME;
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
  if (publicId.startsWith("http://") || publicId.startsWith("https://")) {
    return publicId;
  }

  const id = publicId.replace(/^\/+/, "");
  const cld = new Cloudinary({ cloud: { cloudName: getCloudName() } });
  const image = cld.image(id);

  image.format("auto");
  image.quality("auto");

  return image.toURL();
}
