/**
 * One-off: upload dashboard brand assets to Cloudinary under fixed brand/ public IDs.
 *
 * Usage (from repo root):
 *   bun run scripts/upload-brand-assets.ts
 *
 * Requires CLOUDINARY_* in apps/server/.env (or exported in the shell).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

const ROOT = join(import.meta.dir, "..");
const LOGOS_DIR = join(ROOT, "apps/dashboard/public/logos");

dotenv.config({ path: join(ROOT, "apps/server/.env") });

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error(
    "Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET (apps/server/.env).",
  );
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

const BRAND_TAGS = ["brand", "static", "marketing", "logo"] as const;

const UPLOADS: { file: string; publicId: string }[] = [
  { file: "sycom-logo.jpg", publicId: "brand/sycom-logo-jpg" },
  { file: "sycom-logo.png", publicId: "brand/sycom-logo-png" },
  { file: "sycom-logo-icon.jpg", publicId: "brand/sycom-logo-icon-jpg" },
  { file: "favicon.ico", publicId: "brand/favicon" },
];

async function uploadBrandAsset(file: string, publicId: string) {
  const filePath = join(LOGOS_DIR, file);
  const buffer = readFileSync(filePath);

  const result = await cloudinary.uploader.upload(
    `data:application/octet-stream;base64,${buffer.toString("base64")}`,
    {
      public_id: publicId,
      asset_folder: "brand",
      overwrite: true,
      invalidate: true,
      unique_filename: false,
      use_filename: false,
      tags: [...BRAND_TAGS],
    },
  );

  console.log(`OK  ${publicId}  (${result.bytes} bytes, ${result.format})`);
  console.log(`    ${result.secure_url}`);
}

console.log(`Uploading brand assets to Cloudinary cloud: ${cloudName}`);
console.log(
  "Prod dashboard must be built with the same VITE_CLOUDINARY_CLOUD_NAME (GitHub production var).\n",
);

for (const { file, publicId } of UPLOADS) {
  await uploadBrandAsset(file, publicId);
}

console.log("\nDone.");
