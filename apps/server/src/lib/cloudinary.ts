import { env } from "@sycom/env/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface AvatarUploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
}

export function signAvatarUpload({ userId }: { userId: string }): AvatarUploadSignature {
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `users/${userId}/avatar/${crypto.randomUUID()}`;

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, public_id: publicId },
    env.CLOUDINARY_API_SECRET,
  );

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    publicId,
  };
}

export async function deleteAsset(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}
