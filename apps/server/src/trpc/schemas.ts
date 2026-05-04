import { organizationRoleEnum, userRoleEnum } from "@sycom/db/schema/auth";
import {
  COURSE_STATUSES,
  DIFFICULTY_LEVELS,
  INSTRUCTOR_ROLES,
  LESSON_TYPES,
} from "@sycom/db/schema/course";
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

export const listAdminOrganizationsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  sortBy: z.enum(["name", "slug", "createdAt", "memberCount", "owner"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListAdminOrganizationsInput = z.infer<typeof listAdminOrganizationsSchema>;

export const RESERVED_ORGANIZATION_SLUGS = [
  "admin",
  "api",
  "app",
  "auth",
  "dashboard",
  "public",
  "www",
] as const;

const slugPattern = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export const createAdminOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Slug must be at least 2 characters")
    .max(63, "Slug must be at most 63 characters")
    .regex(slugPattern, "Slug must be lowercase letters, numbers, and hyphens")
    .refine((value) => !value.includes("--"), "Slug cannot contain consecutive hyphens")
    .refine(
      (value) =>
        !RESERVED_ORGANIZATION_SLUGS.includes(
          value as (typeof RESERVED_ORGANIZATION_SLUGS)[number],
        ),
      "This slug is reserved",
    ),
  ownerFirstName: z.string().trim().min(1, "Owner first name is required").max(80),
  ownerLastName: z.string().trim().min(1, "Owner last name is required").max(80),
  ownerEmail: z.email("Enter a valid email").transform((value) => value.trim().toLowerCase()),
});
export type CreateAdminOrganizationInput = z.infer<typeof createAdminOrganizationSchema>;

export const deleteAdminOrganizationSchema = z.object({
  organizationId: z.string().min(1),
});
export type DeleteAdminOrganizationInput = z.infer<typeof deleteAdminOrganizationSchema>;

export const getAdminOrganizationSchema = z.object({
  organizationId: z.string().min(1),
});
export type GetAdminOrganizationInput = z.infer<typeof getAdminOrganizationSchema>;

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

export const inviteAdminUserSchema = z.object({
  email: z.email(),
  name: z.string().trim().min(1).max(120),
  role: z.enum(userRoleEnum.enumValues),
});
export type InviteAdminUserInput = z.infer<typeof inviteAdminUserSchema>;

export const deleteAdminUserSchema = z.object({
  userId: z.string().min(1),
});
export type DeleteAdminUserInput = z.infer<typeof deleteAdminUserSchema>;

export const platformInvitationFilterStatusSchema = z.enum([
  "accepted",
  "expired",
  "rejected",
  "revoked",
]);
export type PlatformInvitationFilterStatus = z.infer<typeof platformInvitationFilterStatusSchema>;

export const listPlatformInvitationsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  statuses: z.array(platformInvitationFilterStatusSchema).optional(),
  sentFrom: z.date().optional(),
  sentTo: z.date().optional(),
  sortBy: z.enum(["name", "email", "createdAt"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListPlatformInvitationsInput = z.infer<typeof listPlatformInvitationsSchema>;

export const resendPlatformInvitationSchema = z.object({
  invitationId: z.string().min(1),
});
export type ResendPlatformInvitationInput = z.infer<typeof resendPlatformInvitationSchema>;

export const revokePlatformInvitationSchema = z.object({
  invitationId: z.string().min(1),
});
export type RevokePlatformInvitationInput = z.infer<typeof revokePlatformInvitationSchema>;

export const organizationInvitationFilterStatusSchema = z.enum(["accepted", "expired", "rejected"]);
export type OrganizationInvitationFilterStatus = z.infer<
  typeof organizationInvitationFilterStatusSchema
>;

export const listAdminOrganizationInvitationsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  roles: z.array(z.enum(organizationRoleEnum.enumValues)).optional(),
  statuses: z.array(organizationInvitationFilterStatusSchema).optional(),
  sentFrom: z.date().optional(),
  sentTo: z.date().optional(),
  sortBy: z.enum(["email", "createdAt", "organizationName"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListAdminOrganizationInvitationsInput = z.infer<
  typeof listAdminOrganizationInvitationsSchema
>;

export const adminLogsAnalyticsOverviewSchema = z.object({});
export type AdminLogsAnalyticsOverviewInput = z.infer<typeof adminLogsAnalyticsOverviewSchema>;

export const adminDashboardOverviewInputSchema = z.object({
  signupDays: z.number().int().min(1).max(90).default(7),
  recentUserLimit: z.number().int().min(1).max(50).default(5),
});
export type AdminDashboardOverviewInput = z.infer<typeof adminDashboardOverviewInputSchema>;

export const adminDashboardOverviewTotalsSchema = z.object({
  users: z.number().int(),
  organizations: z.number().int(),
  activeInvites: z.number().int(),
  pendingReports: z.number().int(),
});
export type AdminDashboardOverviewTotals = z.infer<typeof adminDashboardOverviewTotalsSchema>;

export const adminDashboardSignupDaySchema = z.object({
  date: z.string(),
  total: z.number().int(),
});
export type AdminDashboardSignupDay = z.infer<typeof adminDashboardSignupDaySchema>;

export const adminDashboardRecentUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(userRoleEnum.enumValues).nullable(),
  createdAt: z.date(),
});
export type AdminDashboardRecentUser = z.infer<typeof adminDashboardRecentUserSchema>;

export const adminDashboardOverviewOutputSchema = z.object({
  totals: adminDashboardOverviewTotalsSchema,
  signupsByDay: z.array(adminDashboardSignupDaySchema),
  recentUsers: z.array(adminDashboardRecentUserSchema),
});
export type AdminDashboardOverviewOutput = z.infer<typeof adminDashboardOverviewOutputSchema>;

export const auditActorTypeSchema = z.enum(["user", "system"]);
export type AuditActorTypeInput = z.infer<typeof auditActorTypeSchema>;

export const listAdminAuditLogSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  actorId: z.string().min(1).optional(),
  actorTypes: z.array(auditActorTypeSchema).optional(),
  events: z.array(z.string().min(1)).optional(),
  organizationId: z.string().min(1).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(["createdAt", "event"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListAdminAuditLogInput = z.infer<typeof listAdminAuditLogSchema>;

export const listAdminAuditEventNamesSchema = z.object({});
export type ListAdminAuditEventNamesInput = z.infer<typeof listAdminAuditEventNamesSchema>;

export const adminFeedbackSortFieldSchema = z.enum(["submittedAt"]);
export type AdminFeedbackSortField = z.infer<typeof adminFeedbackSortFieldSchema>;

export const feedbackReportTypes = ["bug", "feature", "complaint", "other"] as const;

export const listAdminFeedbackSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: adminFeedbackSortFieldSchema.default("submittedAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListAdminFeedbackInput = z.infer<typeof listAdminFeedbackSchema>;

export const feedbackReportStatusSchema = z.enum(["pending", "in_progress", "resolved", "closed"]);
export type FeedbackReportStatus = z.infer<typeof feedbackReportStatusSchema>;

export const feedbackReportTypeSchema = z.enum(feedbackReportTypes);
export type FeedbackReportType = z.infer<typeof feedbackReportTypeSchema>;

export const listAdminReportsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  statuses: z.array(feedbackReportStatusSchema).optional(),
  types: z.array(feedbackReportTypeSchema).optional(),
  sortBy: adminFeedbackSortFieldSchema.default("submittedAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListAdminReportsInput = z.infer<typeof listAdminReportsSchema>;

export const updateAdminReportStatusSchema = z.object({
  reportId: z.string().min(1),
  status: feedbackReportStatusSchema,
});
export type UpdateAdminReportStatusInput = z.infer<typeof updateAdminReportStatusSchema>;

// invite
export const getPlatformInvitationByTokenSchema = z.object({
  token: z.string().min(1),
});
export type GetPlatformInvitationByTokenInput = z.infer<typeof getPlatformInvitationByTokenSchema>;

export const acceptPlatformInvitationSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});
export type AcceptPlatformInvitationInput = z.infer<typeof acceptPlatformInvitationSchema>;

export const rejectPlatformInvitationSchema = z.object({
  token: z.string().min(1),
});
export type RejectPlatformInvitationInput = z.infer<typeof rejectPlatformInvitationSchema>;

export const getOrganizationInvitationByTokenSchema = z.object({
  token: z.string().min(1),
});
export type GetOrganizationInvitationByTokenInput = z.infer<
  typeof getOrganizationInvitationByTokenSchema
>;

export const acceptOrganizationInvitationSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});
export type AcceptOrganizationInvitationInput = z.infer<typeof acceptOrganizationInvitationSchema>;

export const rejectOrganizationInvitationSchema = z.object({
  token: z.string().min(1),
});
export type RejectOrganizationInvitationInput = z.infer<typeof rejectOrganizationInvitationSchema>;

// feedback
export const submitFeedbackSchema = z.object({
  email: z.email(),
  message: z.string().trim().min(1).max(5000),
});
export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;

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

// lesson (platform course curriculum)
export const getLessonInputSchema = z.object({
  lessonId: z.string().min(1),
});
export type GetLessonInput = z.infer<typeof getLessonInputSchema>;

export const listLessonsByCourseInputSchema = z.object({
  courseId: z.string().min(1),
});
export type ListLessonsByCourseInput = z.infer<typeof listLessonsByCourseInputSchema>;

export const createLessonInputSchema = z.object({
  courseId: z.string().min(1),
  sectionId: z.string().min(1),
  title: z.string().trim().min(1, "Lesson title is required").max(200),
  type: z.enum(LESSON_TYPES).default("article"),
  openAt: z.coerce.date().nullable().optional(),
  dueAt: z.coerce.date().nullable().optional(),
});
export type CreateLessonInput = z.infer<typeof createLessonInputSchema>;

export const deleteLessonInputSchema = z.object({
  lessonId: z.string().min(1),
});
export type DeleteLessonInput = z.infer<typeof deleteLessonInputSchema>;

export const updateLessonInputSchema = z.object({
  lessonId: z.string().min(1),
  patch: z
    .object({
      title: z.string().trim().min(1).max(200).optional(),
      content: z.unknown().optional(),
      type: z.enum(LESSON_TYPES).optional(),
      openAt: z.coerce.date().nullable().optional(),
      dueAt: z.coerce.date().nullable().optional(),
    })
    .refine((patch) => Object.keys(patch).length > 0, "At least one field must change"),
});
export type UpdateLessonInput = z.infer<typeof updateLessonInputSchema>;

export const checkLessonAnswerInputSchema = z.object({
  lessonId: z.string().min(1),
  questionId: z.string().min(1),
  selected: z.array(z.string().min(1)),
});
export type CheckLessonAnswerInput = z.infer<typeof checkLessonAnswerInputSchema>;

// enrollment
export const enrollInCourseInputSchema = z.object({
  courseId: z.string().min(1),
});
export type EnrollInCourseInput = z.infer<typeof enrollInCourseInputSchema>;

export const getMyCourseProgressInputSchema = z.object({
  courseId: z.string().min(1),
});
export type GetMyCourseProgressInput = z.infer<typeof getMyCourseProgressInputSchema>;

export const markLessonStartedInputSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
});
export type MarkLessonStartedInput = z.infer<typeof markLessonStartedInputSchema>;

export const markLessonCompletedInputSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
});
export type MarkLessonCompletedInput = z.infer<typeof markLessonCompletedInputSchema>;

export const submitLessonAttemptInputSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selected: z.array(z.string().min(1)),
    }),
  ),
});
export type SubmitLessonAttemptInput = z.infer<typeof submitLessonAttemptInputSchema>;

export const listCourseEnrollmentsSchema = z.object({
  courseId: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
});
export type ListCourseEnrollmentsInput = z.infer<typeof listCourseEnrollmentsSchema>;

export const getCourseEnrollmentDetailSchema = z.object({
  courseId: z.string().min(1),
  enrollmentId: z.string().min(1),
});
export type GetCourseEnrollmentDetailInput = z.infer<typeof getCourseEnrollmentDetailSchema>;

export const removeCourseEnrollmentSchema = z.object({
  courseId: z.string().min(1),
  enrollmentId: z.string().min(1),
});
export type RemoveCourseEnrollmentInput = z.infer<typeof removeCourseEnrollmentSchema>;

// course (platform-owned courses UI + taxonomy)
const courseSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug must be at least 2 characters")
  .max(80, "Slug must be at most 80 characters")
  .regex(slugPattern, "Slug must be lowercase letters, numbers, and hyphens")
  .refine((value) => !value.includes("--"), "Slug cannot contain consecutive hyphens");

export const listCoursesSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  statuses: z.array(z.enum(COURSE_STATUSES)).optional(),
  difficulties: z.array(z.enum(DIFFICULTY_LEVELS)).optional(),
  categoryIds: z.array(z.string().min(1)).optional(),
  instructorId: z.string().min(1).optional(),
  sortBy: z.enum(["title", "createdAt", "updatedAt", "status", "difficulty"]).default("updatedAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListCoursesInput = z.infer<typeof listCoursesSchema>;

export const getCourseSchema = z.object({
  courseId: z.string().min(1),
});
export type GetCourseInput = z.infer<typeof getCourseSchema>;

export const getCourseCurriculumSchema = z.object({
  courseId: z.string().min(1),
});
export type GetCourseCurriculumInput = z.infer<typeof getCourseCurriculumSchema>;

export const listCourseCoInstructorsSchema = z.object({
  courseId: z.string().min(1),
});
export type ListCourseCoInstructorsInput = z.infer<typeof listCourseCoInstructorsSchema>;

export const addCourseCoInstructorSchema = z.object({
  courseId: z.string().min(1),
  userId: z.string().min(1),
});
export type AddCourseCoInstructorInput = z.infer<typeof addCourseCoInstructorSchema>;

export const removeCourseCoInstructorSchema = z.object({
  courseId: z.string().min(1),
  userId: z.string().min(1),
});
export type RemoveCourseCoInstructorInput = z.infer<typeof removeCourseCoInstructorSchema>;

export const listAvailableCourseCoInstructorsSchema = z.object({
  courseId: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
});
export type ListAvailableCourseCoInstructorsInput = z.infer<
  typeof listAvailableCourseCoInstructorsSchema
>;

export const listSeededCourseOrganizationsSchema = z.object({
  courseId: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
});
export type ListSeededCourseOrganizationsInput = z.infer<
  typeof listSeededCourseOrganizationsSchema
>;

export const getCourseAnalyticsSchema = z.object({
  courseId: z.string().min(1),
});
export type GetCourseAnalyticsInput = z.infer<typeof getCourseAnalyticsSchema>;

export const createSectionSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(1, "Section title is required").max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  openAt: z.coerce.date().nullable().optional(),
  dueAt: z.coerce.date().nullable().optional(),
});
export type CreateSectionInput = z.infer<typeof createSectionSchema>;

export const updateSectionSchema = z.object({
  sectionId: z.string().min(1),
  patch: z
    .object({
      title: z.string().trim().min(1).max(200).optional(),
      description: z.string().trim().max(2000).nullable().optional(),
      openAt: z.coerce.date().nullable().optional(),
      dueAt: z.coerce.date().nullable().optional(),
    })
    .refine((patch) => Object.keys(patch).length > 0, "At least one field must change"),
});
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

export const deleteSectionSchema = z.object({
  sectionId: z.string().min(1),
});
export type DeleteSectionInput = z.infer<typeof deleteSectionSchema>;

export const saveCurriculumOrderSchema = z.object({
  courseId: z.string().min(1),
  sections: z.array(
    z.object({
      sectionId: z.string().min(1),
      lessonIds: z.array(z.string().min(1)),
    }),
  ),
});
export type SaveCurriculumOrderInput = z.infer<typeof saveCurriculumOrderSchema>;

export const createCourseSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  slug: courseSlugSchema,
  description: z.string().trim().max(2000).optional(),
  imageUrl: z.string().trim().min(1).optional(),
  difficulty: z.enum(DIFFICULTY_LEVELS).default("beginner"),
  estimatedDuration: z.number().int().positive().max(100_000).optional(),
  status: z.enum(COURSE_STATUSES).default("draft"),
  instructorIds: z.array(z.string().min(1)).default([]),
  categoryIds: z.array(z.string().min(1)).default([]),
});
export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = z.object({
  courseId: z.string().min(1),
  patch: z
    .object({
      title: z.string().trim().min(1).max(160).optional(),
      slug: courseSlugSchema.optional(),
      description: z.string().trim().max(2000).nullable().optional(),
      summary: z
        .unknown()
        .nullable()
        .optional()
        .check(
          z.refine((value) => {
            if (value === undefined || value === null) return true;
            if (typeof value === "string") return value.length <= 20_000;
            try {
              return JSON.stringify(value).length <= 20_000;
            } catch {
              return false;
            }
          }, "Summary must be at most 20,000 characters when serialized"),
        ),
      imageUrl: z.string().trim().min(1).nullable().optional(),
      difficulty: z.enum(DIFFICULTY_LEVELS).optional(),
      estimatedDuration: z.number().int().positive().max(100_000).nullable().optional(),
      status: z.enum(COURSE_STATUSES).optional(),
    })
    .refine((patch) => Object.keys(patch).length > 0, "At least one field must change"),
});
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

export const deleteCourseSchema = z.object({
  courseId: z.string().min(1),
});
export type DeleteCourseInput = z.infer<typeof deleteCourseSchema>;

export const seedAdminCourseSchema = z.object({
  courseId: z.string().min(1),
  organizationIds: z.array(z.string().min(1)).min(1, "Pick at least one organization"),
});
export type SeedAdminCourseInput = z.infer<typeof seedAdminCourseSchema>;

export const addCourseInstructorSchema = z.object({
  courseId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(INSTRUCTOR_ROLES).default("secondary"),
});
export type AddCourseInstructorInput = z.infer<typeof addCourseInstructorSchema>;

export const removeCourseInstructorSchema = z.object({
  courseId: z.string().min(1),
  userId: z.string().min(1),
});
export type RemoveCourseInstructorInput = z.infer<typeof removeCourseInstructorSchema>;

export const setCourseCategoriesSchema = z.object({
  courseId: z.string().min(1),
  categoryIds: z.array(z.string().min(1)),
});
export type SetCourseCategoriesInput = z.infer<typeof setCourseCategoriesSchema>;

const categorySlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(60)
  .regex(slugPattern, "Slug must be lowercase letters, numbers, and hyphens");

export const listAdminCategoriesSchema = z.object({
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  sortBy: z.enum(["name", "slug", "order"]).default("name"),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
});
export type ListAdminCategoriesInput = z.infer<typeof listAdminCategoriesSchema>;

export const createAdminCategorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: categorySlugSchema,
  order: z.number().int().min(0).max(10_000).default(0),
});
export type CreateAdminCategoryInput = z.infer<typeof createAdminCategorySchema>;

export const updateAdminCategorySchema = z.object({
  categoryId: z.string().min(1),
  patch: z
    .object({
      name: z.string().trim().min(1).max(80).optional(),
      slug: categorySlugSchema.optional(),
      order: z.number().int().min(0).max(10_000).optional(),
    })
    .refine((patch) => Object.keys(patch).length > 0, "At least one field must change"),
});
export type UpdateAdminCategoryInput = z.infer<typeof updateAdminCategorySchema>;

export const deleteAdminCategorySchema = z.object({
  categoryId: z.string().min(1),
});
export type DeleteAdminCategoryInput = z.infer<typeof deleteAdminCategorySchema>;
