import { organizationRoleEnum, userRoleEnum } from "@sycom/db/schema/auth";
import {
  COURSE_STATUSES,
  DIFFICULTY_LEVELS,
  INSTRUCTOR_ROLES,
  LESSON_TYPES,
} from "@sycom/db/schema/course";
import { LESSON_PROGRESS_STATUSES } from "@sycom/db/schema/enrollment";
import { CERTIFICATE_TEMPLATE_IDS } from "@sycom/certificates/meta";
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

export const creatorDashboardOverviewInputSchema = z.object({
  enrollmentDays: z.number().int().min(1).max(90).default(7),
  recentCourseLimit: z.number().int().min(1).max(50).default(5),
});
export type CreatorDashboardOverviewInput = z.infer<typeof creatorDashboardOverviewInputSchema>;

export const creatorDashboardTotalsSchema = z.object({
  assignedCourses: z.number().int(),
  draftCourses: z.number().int(),
  publishedCourses: z.number().int(),
  totalEnrollments: z.number().int(),
});
export type CreatorDashboardTotalsOutput = z.infer<typeof creatorDashboardTotalsSchema>;

export const creatorDashboardEnrollmentDaySchema = z.object({
  date: z.string(),
  total: z.number().int(),
});
export type CreatorDashboardEnrollmentDayOutput = z.infer<
  typeof creatorDashboardEnrollmentDaySchema
>;

export const creatorDashboardRecentCourseSchema = z.object({
  enrollmentCount: z.number().int(),
  id: z.string(),
  slug: z.string(),
  status: z.enum(["draft", "published"]),
  title: z.string(),
  updatedAt: z.date(),
});
export type CreatorDashboardRecentCourseOutput = z.infer<typeof creatorDashboardRecentCourseSchema>;

export const creatorDashboardOverviewOutputSchema = z.object({
  enrollmentsByDay: z.array(creatorDashboardEnrollmentDaySchema),
  recentCourses: z.array(creatorDashboardRecentCourseSchema),
  totals: creatorDashboardTotalsSchema,
});
export type CreatorDashboardOverviewOutput = z.infer<typeof creatorDashboardOverviewOutputSchema>;

// student
export const studentDashboardOverviewInputSchema = z.object({
  enrollmentDays: z.number().int().min(1).max(90).default(7),
  continueLearningLimit: z.number().int().min(1).max(50).default(5),
});
export type StudentDashboardOverviewInput = z.infer<typeof studentDashboardOverviewInputSchema>;

export const studentDashboardTotalsSchema = z.object({
  enrolledCourses: z.number().int(),
  completedCourses: z.number().int(),
  inProgressCourses: z.number().int(),
  certificatesEarned: z.number().int(),
});
export type StudentDashboardTotalsOutput = z.infer<typeof studentDashboardTotalsSchema>;

export const studentDashboardEnrollmentDaySchema = z.object({
  date: z.string(),
  total: z.number().int(),
});
export type StudentDashboardEnrollmentDayOutput = z.infer<
  typeof studentDashboardEnrollmentDaySchema
>;

export const studentDashboardContinueLearningSchema = z.object({
  courseId: z.string(),
  title: z.string(),
  slug: z.string(),
  imageUrl: z.string().nullable(),
  enrollmentStatus: z.string(),
  lastActivityAt: z.date().nullable(),
  completedLessonCount: z.number().int(),
  totalLessonCount: z.number().int(),
  certificateIssued: z.boolean(),
  nextLessonId: z.string().nullable(),
});
export type StudentDashboardContinueLearningOutput = z.infer<
  typeof studentDashboardContinueLearningSchema
>;

export const studentDashboardOverviewOutputSchema = z.object({
  enrollmentsByDay: z.array(studentDashboardEnrollmentDaySchema),
  continueLearning: z.array(studentDashboardContinueLearningSchema),
  totals: studentDashboardTotalsSchema,
});
export type StudentDashboardOverviewOutput = z.infer<typeof studentDashboardOverviewOutputSchema>;

export const studentLibrarySectionSchema = z.object({
  sectionId: z.string(),
  title: z.string(),
  order: z.number().int(),
  totalLessonCount: z.number().int(),
  completedLessonCount: z.number().int(),
});
export type StudentLibrarySectionOutput = z.infer<typeof studentLibrarySectionSchema>;

export const studentLibraryCourseSchema = z.object({
  courseId: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  difficulty: z.string(),
  enrollmentStatus: z.string(),
  startedAt: z.date().nullable(),
  lastActivityAt: z.date().nullable(),
  completedLessonCount: z.number().int(),
  totalLessonCount: z.number().int(),
  certificateIssued: z.boolean(),
  nextLessonId: z.string().nullable(),
  sections: z.array(studentLibrarySectionSchema),
});
export type StudentLibraryCourseOutput = z.infer<typeof studentLibraryCourseSchema>;

export const studentLibraryCertificateSchema = z.object({
  certificateId: z.string(),
  courseId: z.string(),
  courseTitle: z.string(),
  courseSlug: z.string(),
  certificateNumber: z.string(),
  issuedAt: z.date(),
});
export type StudentLibraryCertificateOutput = z.infer<typeof studentLibraryCertificateSchema>;

export const studentLibraryInputSchema = z.object({}).default({});
export type StudentLibraryInput = z.infer<typeof studentLibraryInputSchema>;

export const studentCourseScoresInputSchema = z.object({
  courseId: z.string().min(1),
});
export type StudentCourseScoresInput = z.infer<typeof studentCourseScoresInputSchema>;

export const studentLibraryOutputSchema = z.object({
  totals: studentDashboardTotalsSchema,
  courses: z.array(studentLibraryCourseSchema),
  certificates: z.array(studentLibraryCertificateSchema),
});
export type StudentLibraryOutput = z.infer<typeof studentLibraryOutputSchema>;

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

export const accentHexSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a #RRGGBB color");

// organization
export const organizationMembershipSummarySchema = z.object({
  organizationId: z.string(),
  name: z.string(),
  slug: z.string(),
});
export type OrganizationMembershipSummary = z.infer<typeof organizationMembershipSummarySchema>;

export const organizationMembershipsOutputSchema = z.array(organizationMembershipSummarySchema);
export type OrganizationMembershipsOutput = z.infer<typeof organizationMembershipsOutputSchema>;

export const organizationWorkspaceContextOutputSchema = z.object({
  organizationId: z.string(),
  name: z.string(),
  slug: z.string(),
  logoPublicId: z.string().nullable(),
  accentHex: accentHexSchema,
  memberRole: z.enum(organizationRoleEnum.enumValues),
});
export type OrganizationWorkspaceContextOutput = z.infer<
  typeof organizationWorkspaceContextOutputSchema
>;

export const updateOrganizationBrandingSchema = z
  .object({
    accentHex: accentHexSchema.optional(),
    logoPublicId: z.string().min(1).optional(),
  })
  .refine((value) => value.accentHex !== undefined || value.logoPublicId !== undefined, {
    message: "Provide accentHex and/or logoPublicId",
  });
export type UpdateOrganizationBrandingInput = z.infer<typeof updateOrganizationBrandingSchema>;

// onboarding
export const onboardingDefaultNextPathSchema = z
  .union([z.literal("/onboarding"), z.literal("/onboarding/organization")])
  .nullable();
export type OnboardingDefaultNextPath = z.infer<typeof onboardingDefaultNextPathSchema>;

export const onboardingStatusSchema = z.object({
  profileOnboarded: z.boolean(),
  needsProfileStep: z.boolean(),
  needsOrgOwnerStep: z.boolean(),
  activeOrganizationId: z.string().nullable(),
  defaultNextPath: onboardingDefaultNextPathSchema,
});
export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;

export const completeProfileOnboardingSchema = z.object({
  bio: z.string().max(500).optional(),
  skip: z.boolean().optional(),
});
export type CompleteProfileOnboardingInput = z.infer<typeof completeProfileOnboardingSchema>;

export const completeOrganizationOnboardingSchema = z.object({
  skipRemaining: z.boolean().optional(),
  logoPublicId: z.string().min(1).optional(),
  accentHex: accentHexSchema.optional(),
});
export type CompleteOrganizationOnboardingInput = z.infer<
  typeof completeOrganizationOnboardingSchema
>;

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

// catalog (student course catalog + enroll)
export const listCatalogCoursesSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  difficulties: z.array(z.enum(DIFFICULTY_LEVELS)).optional(),
  categoryIds: z.array(z.string().min(1)).optional(),
  enrolledOnly: z.boolean().optional(),
  sortBy: z.enum(["title", "updatedAt", "difficulty"]).default("updatedAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListCatalogCoursesInput = z.infer<typeof listCatalogCoursesSchema>;

export const getCatalogCourseSchema = z.object({
  courseId: z.string().min(1),
});
export type GetCatalogCourseInput = z.infer<typeof getCatalogCourseSchema>;

export const enrollInCatalogCourseSchema = z.object({
  courseId: z.string().min(1),
});
export type EnrollInCatalogCourseInput = z.infer<typeof enrollInCatalogCourseSchema>;

// learn (course player)
export const learnGetPlayerContextSchema = z.object({
  courseId: z.string().min(1),
});
export type LearnGetPlayerContextInput = z.infer<typeof learnGetPlayerContextSchema>;

export const learnGetLessonSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
});
export type LearnGetLessonInput = z.infer<typeof learnGetLessonSchema>;

export const learnCheckAnswerSchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  questionId: z.string().min(1),
  selected: z.array(z.string().min(1)),
});
export type LearnCheckAnswerInput = z.infer<typeof learnCheckAnswerSchema>;

export const EXAM_INTEGRITY_EVENT_KINDS = [
  "tab_hidden",
  "fullscreen_exit",
  "fullscreen_denied",
] as const;
export type ExamIntegrityEventKind = (typeof EXAM_INTEGRITY_EVENT_KINDS)[number];

export const learnRecordExamIntegritySchema = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  kind: z.enum(EXAM_INTEGRITY_EVENT_KINDS),
});
export type LearnRecordExamIntegrityInput = z.infer<typeof learnRecordExamIntegritySchema>;

export const learnRecordExamIntegrityOutputSchema = z.object({
  success: z.literal(true),
});
export type LearnRecordExamIntegrityOutput = z.infer<typeof learnRecordExamIntegrityOutputSchema>;

export const learnLessonLockSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("scheduled_section"),
    opensAt: z.date(),
  }),
  z.object({
    kind: z.literal("scheduled_lesson"),
    opensAt: z.date(),
  }),
  z.object({
    kind: z.literal("deadline_section"),
    dueAt: z.date(),
  }),
  z.object({
    kind: z.literal("deadline_lesson"),
    dueAt: z.date(),
  }),
  z.object({
    kind: z.literal("progression"),
  }),
]);
export type LearnLessonLock = z.infer<typeof learnLessonLockSchema>;

const learnLessonOutlineSchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  title: z.string(),
  type: z.enum(LESSON_TYPES),
  openAt: z.date().nullable(),
  dueAt: z.date().nullable(),
  order: z.number(),
  progressStatus: z.enum(LESSON_PROGRESS_STATUSES),
  locked: z.boolean(),
  lock: learnLessonLockSchema.optional(),
});

const learnSectionOutlineSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  openAt: z.date().nullable(),
  dueAt: z.date().nullable(),
  order: z.number(),
  lessons: z.array(learnLessonOutlineSchema),
});

export const learnPlayerContextOutputSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("course_not_found") }),
  z.object({
    status: z.literal("catalog_forbidden"),
    contactEmail: z.string(),
    isPlatformCourse: z.boolean(),
  }),
  z.object({
    status: z.literal("not_enrolled"),
    contactEmail: z.string(),
    isPlatformCourse: z.boolean(),
  }),
  z.object({
    status: z.literal("ok"),
    courseId: z.string(),
    courseTitle: z.string(),
    completedLessonCount: z.number(),
    totalLessonCount: z.number(),
    progressPercent: z.number(),
    nextLessonId: z.string().nullable(),
    sections: z.array(learnSectionOutlineSchema),
  }),
]);
export type LearnPlayerContextOutput = z.infer<typeof learnPlayerContextOutputSchema>;

export const learnLessonAnswerSchema = z.object({
  selected: z.array(z.string()),
  isCorrect: z.boolean(),
});
export type LearnLessonAnswer = z.infer<typeof learnLessonAnswerSchema>;

export const learnGetLessonOutputSchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  courseId: z.string(),
  title: z.string(),
  type: z.enum(LESSON_TYPES),
  openAt: z.date().nullable(),
  dueAt: z.date().nullable(),
  order: z.number(),
  content: z.unknown().nullable(),
  sectionTitle: z.string(),
  answers: z.record(z.string(), learnLessonAnswerSchema),
  answersSource: z.enum(["completed", "draft", "none"]),
});
export type LearnGetLessonOutput = z.infer<typeof learnGetLessonOutputSchema>;

export const learnCheckAnswerOutputSchema = z.object({
  isCorrect: z.boolean(),
});
export type LearnCheckAnswerOutput = z.infer<typeof learnCheckAnswerOutputSchema>;

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

export const getCourseAnalyticsOverviewSchema = z.object({
  courseId: z.string().min(1),
});
export type GetCourseAnalyticsOverviewInput = z.infer<typeof getCourseAnalyticsOverviewSchema>;

export const listCourseAnalyticsStudentsSchema = z.object({
  courseId: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  sortBy: z.enum(["name"]).default("name"),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
});
export type ListCourseAnalyticsStudentsInput = z.infer<typeof listCourseAnalyticsStudentsSchema>;

export const getCourseAnalyticsStudentSchema = z.object({
  courseId: z.string().min(1),
  enrollmentId: z.string().min(1),
});
export type GetCourseAnalyticsStudentInput = z.infer<typeof getCourseAnalyticsStudentSchema>;

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

const courseCertificateTemplateIdSchema = z.enum(
  CERTIFICATE_TEMPLATE_IDS as unknown as [(typeof CERTIFICATE_TEMPLATE_IDS)[number], ...string[]],
);

export const courseCertificateKeywordsSchema = z.object({
  awardHeadline: z.string().trim().max(320).optional(),
  certifyPhrase: z.string().trim().max(320).optional(),
  issuerLine: z.string().trim().max(320).optional(),
  footnoteLine: z.string().trim().max(500).optional(),
});
export type CourseCertificateKeywordsInput = z.infer<typeof courseCertificateKeywordsSchema>;

export const courseCertificateSettingsStoredSchema = z.object({
  templateId: courseCertificateTemplateIdSchema,
  keywords: courseCertificateKeywordsSchema.optional(),
});
export type CourseCertificateSettingsStoredInput = z.infer<
  typeof courseCertificateSettingsStoredSchema
>;

export const updateCourseCertificateSettingsSchema = z.object({
  courseId: z.string().min(1),
  certificateSettings: courseCertificateSettingsStoredSchema,
});
export type UpdateCourseCertificateSettingsInput = z.infer<
  typeof updateCourseCertificateSettingsSchema
>;

export const createCourseSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  slug: courseSlugSchema,
  description: z.string().trim().max(2000).optional(),
  imageUrl: z.string().trim().min(1).optional(),
  difficulty: z.enum(DIFFICULTY_LEVELS).default("beginner"),
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
