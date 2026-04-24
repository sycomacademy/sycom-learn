/**
 * Catalogue of static (committed-ish) assets hosted on the CDN.
 * Public IDs are the storage keys uploaded to Cloudinary; renaming an
 * asset is one edit here, not a search-and-replace across the codebase.
 *
 * User-generated assets (avatars, course content) live in the DB, not here.
 */

export const BRAND = {
  LOGO: "brand/sycom-logo",
  LOGO_FULL: "brand/sycom-logo-full",
  LOGO_WHITE: "brand/sycom-logo-white",
  APPLE_ICON: "brand/apple-icon",
  FAVICON: "brand/favicon",
} as const;

export const MARKETING = {
  AUTH_LANDSCAPE: "marketing/auth-landscape",
  AUTH_LOGIN: "marketing/auth-login",
} as const;
