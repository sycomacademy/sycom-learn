import { auth } from "@sycom/auth";
import { sendOrgOwnerAssignedEmail, sendPlatformInviteEmail } from "@sycom/auth/config";
import {
  createOrganizationWithOwner,
  createPlatformInvitation,
  deleteOrganization,
  getActivePlatformInvitationByEmail,
  getAdminOrganizationById,
  getAdminUserById,
  getOrganizationBySlug,
  listAdminOrganizations,
  getPlatformInvitationById,
  getPlatformUserByEmail,
  listAdminUsers,
  listAuditLog,
  listDistinctAuditEventNames,
  listOrganizationInvitations,
  listPlatformInvitations,
  markPlatformInvitationRevoked,
  refreshPlatformInvitation,
} from "@sycom/db/queries/index";
import { env } from "@sycom/env/server";
import { TRPCError } from "@trpc/server";
import { createHash, randomBytes } from "node:crypto";

import { adminProcedure, protectedProcedure, router } from "../init";
import { audit } from "../utils/audit";
import {
  adminLogsAnalyticsOverviewSchema,
  banAdminUserSchema,
  createAdminOrganizationSchema,
  deleteAdminOrganizationSchema,
  deleteAdminUserSchema,
  getAdminOrganizationSchema,
  listAdminAuditEventNamesSchema,
  listAdminAuditLogSchema,
  listAdminOrganizationInvitationsSchema,
  listAdminOrganizationsSchema,
  getAdminUserSchema,
  impersonateAdminUserSchema,
  inviteAdminUserSchema,
  listPlatformInvitationsSchema,
  listAdminUsersSchema,
  resendPlatformInvitationSchema,
  revokePlatformInvitationSchema,
  setAdminUserRoleSchema,
  unbanAdminUserSchema,
} from "../schemas";
import { platformPermissionMiddleware } from "../middleware/permissions";

const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

function buildInviteToken() {
  const token = randomBytes(32).toString("base64url");

  return {
    token,
    tokenHash: createHash("sha256").update(token).digest("hex"),
  };
}

function buildInviteUrl(token: string) {
  const dashboardUrl = env.DASHBOARD_URL ?? env.BETTER_AUTH_URL;
  return `${dashboardUrl}/accept-invite?token=${token}`;
}

function buildOrganizationOwnerInviteUrl(token: string) {
  const dashboardUrl = env.DASHBOARD_URL ?? env.BETTER_AUTH_URL;
  return `${dashboardUrl}/accept-invite?kind=organization&token=${encodeURIComponent(token)}`;
}

export const adminRouter = router({
  listUsers: adminProcedure
    .use(platformPermissionMiddleware({ user: ["list"] }))
    .input(listAdminUsersSchema)
    .query(async ({ ctx, input }) => {
      return await listAdminUsers(ctx.db, input);
    }),

  getUser: adminProcedure
    .use(platformPermissionMiddleware({ user: ["list", "get"] }))
    .input(getAdminUserSchema)
    .query(async ({ ctx, input }) => {
      const user = await getAdminUserById(ctx.db, input);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return user;
    }),

  banUser: adminProcedure
    .use(platformPermissionMiddleware({ user: ["ban"] }))
    .input(banAdminUserSchema)
    .mutation(async ({ ctx, input }) => {
      await auth.api.banUser({
        body: input,
        headers: ctx.headers,
      });

      await audit(ctx, {
        event: "admin.user.banned",
        entityType: "user",
        entityId: input.userId,
        metadata: { banReason: input.banReason },
      });

      return { success: true };
    }),

  unbanUser: adminProcedure
    .use(platformPermissionMiddleware({ user: ["ban"] }))
    .input(unbanAdminUserSchema)
    .mutation(async ({ ctx, input }) => {
      await auth.api.unbanUser({
        body: input,
        headers: ctx.headers,
      });

      await audit(ctx, {
        event: "admin.user.unbanned",
        entityType: "user",
        entityId: input.userId,
      });

      return { success: true };
    }),

  setUserRole: adminProcedure
    .use(platformPermissionMiddleware({ user: ["set-role"] }))
    .input(setAdminUserRoleSchema)
    .mutation(async ({ ctx, input }) => {
      await auth.api.adminUpdateUser({
        body: {
          userId: input.userId,
          data: {
            role: input.role,
          },
        },
        headers: ctx.headers,
      });

      await audit(ctx, {
        event: "admin.user.role_changed",
        entityType: "user",
        entityId: input.userId,
        metadata: { role: input.role },
      });

      return { success: true };
    }),

  impersonateUser: adminProcedure
    .use(platformPermissionMiddleware({ user: ["impersonate"] }))
    .input(impersonateAdminUserSchema)
    .mutation(async ({ ctx, input }) => {
      const { headers } = await auth.api.impersonateUser({
        body: input,
        headers: ctx.headers,
        returnHeaders: true,
      });

      for (const cookie of headers.getSetCookie()) {
        ctx.context.header("set-cookie", cookie, { append: true });
      }

      await audit(ctx, {
        event: "admin.user.impersonation.started",
        entityType: "user",
        entityId: input.userId,
      });

      return { success: true };
    }),

  stopImpersonatingUser: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session.session.impersonatedBy) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "You are not impersonating any user" });
    }
    const impersonatedUserId = ctx.session.user.id;
    const { headers } = await auth.api.stopImpersonating({
      headers: ctx.headers,
      returnHeaders: true,
    });

    for (const cookie of headers.getSetCookie()) {
      ctx.context.header("set-cookie", cookie, { append: true });
    }

    await audit(ctx, {
      event: "admin.user.impersonation.stopped",
      entityType: "user",
      entityId: impersonatedUserId,
    });

    return { success: true };
  }),

  deleteUser: adminProcedure
    .use(platformPermissionMiddleware({ user: ["delete"] }))
    .input(deleteAdminUserSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't delete your own account",
        });
      }

      await auth.api.removeUser({
        body: { userId: input.userId },
        headers: ctx.headers,
      });

      await audit(ctx, {
        event: "admin.user.deleted",
        entityType: "user",
        entityId: input.userId,
      });

      return { success: true };
    }),

  // ---------------------------------------------------------------------------
  // Invitations
  // ---------------------------------------------------------------------------

  inviteUser: adminProcedure
    .use(platformPermissionMiddleware({ user: ["create"] }))
    .input(inviteAdminUserSchema)
    .mutation(async ({ ctx, input }) => {
      const [existingUser, activeInvite] = await Promise.all([
        getPlatformUserByEmail(ctx.db, { email: input.email }),
        getActivePlatformInvitationByEmail(ctx.db, { email: input.email }),
      ]);

      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A user with this email already exists.",
        });
      }

      if (activeInvite) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An active invitation already exists for this email.",
        });
      }

      const { token, tokenHash } = buildInviteToken();
      const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
      const invitation = await createPlatformInvitation(ctx.db, {
        email: input.email,
        name: input.name,
        role: input.role,
        tokenHash,
        inviterName: ctx.session.user.name,
        inviterUserId: ctx.session.user.id,
        expiresAt,
      });

      try {
        await sendPlatformInviteEmail({
          to: input.email,
          inviteUrl: buildInviteUrl(token),
          inviterName: ctx.session.user.name,
          name: input.name,
          role: input.role,
        });
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Invitation created but the email failed to send. Resend it from Public invites.",
        });
      }

      await audit(ctx, {
        event: "admin.platform_invite.created",
        entityType: "platform_invitation",
        entityId: invitation.id,
        metadata: { email: input.email, role: input.role },
      });

      return { success: true, invitationId: invitation.id };
    }),

  listPlatformInvitations: adminProcedure
    .use(platformPermissionMiddleware({ user: ["list"] }))
    .input(listPlatformInvitationsSchema)
    .query(async ({ ctx, input }) => {
      return await listPlatformInvitations(ctx.db, input);
    }),

  resendPlatformInvitation: adminProcedure
    .use(platformPermissionMiddleware({ user: ["create"] }))
    .input(resendPlatformInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      const invitation = await getPlatformInvitationById(ctx.db, input);

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
      }

      if (invitation.status === "accepted") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Accepted invitations cannot be resent.",
        });
      }

      if (invitation.status === "rejected") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Rejected invitations cannot be resent.",
        });
      }

      const existingUser = await getPlatformUserByEmail(ctx.db, { email: invitation.email });

      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A user with this email already exists.",
        });
      }

      const { token, tokenHash } = buildInviteToken();
      const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
      const refreshedInvitation = await refreshPlatformInvitation(ctx.db, {
        invitationId: invitation.id,
        tokenHash,
        expiresAt,
      });

      if (!refreshedInvitation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
      }

      await sendPlatformInviteEmail({
        to: invitation.email,
        inviteUrl: buildInviteUrl(token),
        inviterName: refreshedInvitation.inviterName,
        name: refreshedInvitation.name,
        role: refreshedInvitation.role,
      });

      await audit(ctx, {
        event: "admin.platform_invite.resent",
        entityType: "platform_invitation",
        entityId: invitation.id,
        metadata: { email: invitation.email },
      });

      return { success: true };
    }),

  revokePlatformInvitation: adminProcedure
    .use(platformPermissionMiddleware({ user: ["create"] }))
    .input(revokePlatformInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      const invitation = await getPlatformInvitationById(ctx.db, input);

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
      }

      if (invitation.status === "accepted") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Accepted invitations cannot be revoked.",
        });
      }

      if (invitation.status === "rejected") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Rejected invitations cannot be revoked.",
        });
      }

      await markPlatformInvitationRevoked(ctx.db, { invitationId: invitation.id });

      await audit(ctx, {
        event: "admin.platform_invite.revoked",
        entityType: "platform_invitation",
        entityId: invitation.id,
        metadata: { email: invitation.email },
      });

      return { success: true };
    }),

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------

  listAuditLog: adminProcedure
    .use(platformPermissionMiddleware({ audit: ["read"] }))
    .input(listAdminAuditLogSchema)
    .query(async ({ ctx, input }) => {
      return await listAuditLog(ctx.db, input);
    }),

  listAuditEventNames: adminProcedure
    .use(platformPermissionMiddleware({ audit: ["read"] }))
    .input(listAdminAuditEventNamesSchema)
    .query(async ({ ctx }) => {
      return await listDistinctAuditEventNames(ctx.db);
    }),

  getLogsAnalyticsOverview: adminProcedure.input(adminLogsAnalyticsOverviewSchema).query(() => {
    return {
      activity: {
        totalEvents24h: 1482,
        flaggedEvents: 7,
        activeSources: 5,
      },
      reports: {
        pending: 12,
        inReview: 4,
        resolvedThisWeek: 19,
      },
      feedback: {
        unread: 8,
        triagedToday: 6,
        averageResponseHours: 14,
      },
    };
  }),

  // ---------------------------------------------------------------------------
  // Organizations
  // ---------------------------------------------------------------------------

  createOrganization: adminProcedure
    .use(platformPermissionMiddleware({ organization: ["create"] }))
    .input(createAdminOrganizationSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await getOrganizationBySlug(ctx.db, { slug: input.slug });

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An organization with this slug already exists.",
        });
      }

      const ownerAccount = await getPlatformUserByEmail(ctx.db, { email: input.ownerEmail });
      const inviteToken = ownerAccount ? undefined : buildInviteToken();

      const result = await createOrganizationWithOwner(ctx.db, {
        name: input.name,
        slug: input.slug,
        ownerEmail: input.ownerEmail,
        ownerFirstName: input.ownerFirstName,
        ownerLastName: input.ownerLastName,
        inviterUserId: ctx.session.user.id,
        invitationTtlMs: INVITE_TTL_MS,
        invitationTokenHash: inviteToken?.tokenHash,
      });

      const inviteeDisplayName =
        `${input.ownerFirstName.trim()} ${input.ownerLastName.trim()}`.trim();
      const inviterName =
        ctx.session.user.name ?? ctx.session.user.email ?? "A Sycom administrator";
      const dashboardOrigin = env.DASHBOARD_URL ?? env.BETTER_AUTH_URL;

      try {
        if (result.owner.kind === "existing") {
          await sendOrgOwnerAssignedEmail({
            to: input.ownerEmail,
            organizationName: input.name,
            inviterName,
            inviteeName: inviteeDisplayName,
            ctaUrl: `${dashboardOrigin.replace(/\/$/, "")}/dashboard/organisation/setup`,
            scenario: "existing_account",
          });
        } else {
          if (!inviteToken) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Missing invite token.",
            });
          }

          await sendOrgOwnerAssignedEmail({
            to: input.ownerEmail,
            organizationName: input.name,
            inviterName,
            inviteeName: inviteeDisplayName,
            ctaUrl: buildOrganizationOwnerInviteUrl(inviteToken.token),
            scenario: "new_account",
          });
        }
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Organization was created but the invitation email failed to send. Contact the organisation owner manually.",
        });
      }

      await audit(ctx, {
        event: "admin.org.created",
        entityType: "organization",
        entityId: result.organization.id,
        organizationId: result.organization.id,
        metadata: {
          slug: input.slug,
          name: input.name,
          ownerEmail: input.ownerEmail,
          ownerKind: result.owner.kind,
        },
      });

      return {
        success: true,
        organizationId: result.organization.id,
        slug: result.organization.slug,
        owner: result.owner,
      };
    }),
  listOrganizations: adminProcedure
    .use(platformPermissionMiddleware({ organization: ["read"] }))
    .input(listAdminOrganizationsSchema)
    .query(async ({ ctx, input }) => {
      return await listAdminOrganizations(ctx.db, input);
    }),

  listOrganizationInvitations: adminProcedure
    .use(platformPermissionMiddleware({ organization: ["read"] }))
    .input(listAdminOrganizationInvitationsSchema)
    .query(async ({ ctx, input }) => {
      return await listOrganizationInvitations(ctx.db, input);
    }),

  getOrganization: adminProcedure
    .use(platformPermissionMiddleware({ organization: ["read"] }))
    .input(getAdminOrganizationSchema)
    .query(async ({ ctx, input }) => {
      const org = await getAdminOrganizationById(ctx.db, input);

      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      return org;
    }),

  deleteOrganization: adminProcedure
    .use(platformPermissionMiddleware({ organization: ["delete"] }))
    .input(deleteAdminOrganizationSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await deleteOrganization(ctx.db, input);

      if (!result.deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      await audit(ctx, {
        event: "admin.org.deleted",
        entityType: "organization",
        entityId: input.organizationId,
      });

      return { success: true };
    }),
});
