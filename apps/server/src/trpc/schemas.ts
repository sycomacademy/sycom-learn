import { userRoleEnum } from "@sycom/db/schema/auth";
import {
  storageEntityTypeEnum,
  storageFolderEnum,
  storageResourceTypeEnum,
} from "@sycom/db/schema/storage";
import { z } from "zod";

// admin
export const adminUserStatusSchema = z.enum(["verified", "banned", "unverified"]);
export type AdminUserStatus = z.infer<typeof adminUserStatusSchema>;

export const listAdminUsersSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  roles: z.array(z.enum(userRoleEnum.enumValues)).optional(),
  statuses: z.array(adminUserStatusSchema).optional(),
  sortBy: z.enum(["name", "email", "createdAt"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListAdminUsersInput = z.infer<typeof listAdminUsersSchema>;

export const getAdminUserSchema = z.object({
  userId: z.string().min(1),
});
export type GetAdminUserInput = z.infer<typeof getAdminUserSchema>;

export const banAdminUserSchema = z.object({
  userId: z.string().min(1),
  banReason: z.string().trim().min(1).max(500),
});
export type BanAdminUserInput = z.infer<typeof banAdminUserSchema>;

export const unbanAdminUserSchema = z.object({
  userId: z.string().min(1),
});
export type UnbanAdminUserInput = z.infer<typeof unbanAdminUserSchema>;

export const setAdminUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(userRoleEnum.enumValues),
});
export type SetAdminUserRoleInput = z.infer<typeof setAdminUserRoleSchema>;

export const impersonateAdminUserSchema = z.object({
  userId: z.string().min(1),
});
export type ImpersonateAdminUserInput = z.infer<typeof impersonateAdminUserSchema>;

// feedback
export const submitFeedbackSchema = z.object({
  email: z.email(),
  message: z.string().trim().min(1).max(5000),
});
export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;

export const feedbackReportTypes = ["bug", "feature", "complaint", "other"] as const;

export const submitFeedbackReportSchema = z.object({
  reportId: z.uuid(),
  email: z.email(),
  type: z.enum(feedbackReportTypes),
  subject: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(5000),
  imageUrl: z.string().max(2048).optional(),
});
export type SubmitFeedbackReportInput = z.infer<typeof submitFeedbackReportSchema>;

// profile
export const profileSettingsSchema = z.object({
  enableFacehash: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  useDeviceTimezone: z.boolean().optional(),
});
export type ProfileSettings = z.infer<typeof profileSettingsSchema>;

export const profileSelectSchema = z.object({
  userId: z.string(),
  onboardedAt: z.date().nullable(),
  bio: z.string().nullable(),
  settings: profileSettingsSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ProfileSelect = z.infer<typeof profileSelectSchema>;

export const updateNameSchema = z.object({
  name: z.string().min(1),
});
export type UpdateNameInput = z.infer<typeof updateNameSchema>;

export const updateAvatarSchema = z.object({
  publicId: z.string().min(1),
});
export type UpdateAvatarInput = z.infer<typeof updateAvatarSchema>;

export const updateProfileSchema = profileSelectSchema
  .pick({
    onboardedAt: true,
    bio: true,
    settings: true,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one profile field to update",
  });
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  revokeOtherSessions: z.boolean().optional(),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const revokeSessionSchema = z.object({
  token: z.string().min(1),
});
export type RevokeSessionInput = z.infer<typeof revokeSessionSchema>;

// storage
export const signUploadInputSchema = z.object({
  folder: z.enum(storageFolderEnum.enumValues),
  entityType: z.enum(storageEntityTypeEnum.enumValues),
  entityId: z.string().min(1),
});
export type StorageSignUploadInput = z.infer<typeof signUploadInputSchema>;

export const saveAssetInputSchema = z.object({
  publicId: z.string().min(1),
  secureUrl: z.url(),
  folder: z.enum(storageFolderEnum.enumValues),
  entityType: z.enum(storageEntityTypeEnum.enumValues),
  entityId: z.string().min(1),
  resourceType: z.enum(storageResourceTypeEnum.enumValues),
  tags: z.array(z.string()).optional(),
  name: z.string().optional(),
  format: z.string().min(1),
  bytes: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});
export type StorageSaveAssetInput = z.infer<typeof saveAssetInputSchema>;

export const signedUrlInputSchema = z.object({
  publicId: z.string().min(1),
  expireIn: z.number().int().positive(),
  download: z.boolean().optional(),
  resourceType: z.enum(storageResourceTypeEnum.enumValues).optional(),
});
export type StorageSignedUrlInput = z.infer<typeof signedUrlInputSchema>;

export const deleteAssetInputSchema = z.object({
  publicId: z.string().min(1),
  resourceType: z.enum(storageResourceTypeEnum.enumValues).optional(),
});
export type StorageDeleteAssetInput = z.infer<typeof deleteAssetInputSchema>;
