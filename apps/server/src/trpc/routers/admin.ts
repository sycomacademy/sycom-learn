import { auth } from "@sycom/auth";
import { sendPlatformInviteEmail } from "@sycom/auth/config";
import {
  createPlatformInvitation,
  getActivePlatformInvitationByEmail,
  getAdminUserById,
  getPlatformInvitationById,
  getPlatformUserByEmail,
  listAdminUsers,
  listPlatformInvitations,
  markPlatformInvitationRevoked,
  refreshPlatformInvitation,
} from "@sycom/db/queries/index";
import { env } from "@sycom/env/server";
import { TRPCError } from "@trpc/server";
import { createHash, randomBytes } from "node:crypto";

import { adminProcedure, protectedProcedure, router } from "../init";
import {
  adminLogsAnalyticsOverviewSchema,
  banAdminUserSchema,
  deleteAdminUserSchema,
  getAdminUserSchema,
  impersonateAdminUserSchema,
  inviteAdminUserSchema,
  listPlatformInvitationsSchema,
  listAdminUsersSchema,
  resendPlatformInvitationSchema,
  revokePlatformInvitationSchema,
  sendVerificationEmailAdminSchema,
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

export const adminRouter = router({
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

      return { success: true };
    }),

  stopImpersonatingUser: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session.session.impersonatedBy) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "You are not impersonating any user" });
    }
    const { headers } = await auth.api.stopImpersonating({
      headers: ctx.headers,
      returnHeaders: true,
    });

    for (const cookie of headers.getSetCookie()) {
      ctx.context.header("set-cookie", cookie, { append: true });
    }

    return { success: true };
  }),

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

      return { success: true, invitationId: invitation.id };
    }),

  listPlatformInvitations: adminProcedure
    .use(platformPermissionMiddleware({ user: ["list"] }))
    .input(listPlatformInvitationsSchema)
    .query(async ({ ctx }) => {
      return await listPlatformInvitations(ctx.db);
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

      return { success: true };
    }),

  sendUserVerificationEmail: adminProcedure
    .use(platformPermissionMiddleware({ user: ["create"] }))
    .input(sendVerificationEmailAdminSchema)
    .mutation(async ({ ctx, input }) => {
      const target = await getAdminUserById(ctx.db, input);

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (target.emailVerified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This user's email is already verified",
        });
      }

      const dashboardUrl = env.DASHBOARD_URL ?? env.BETTER_AUTH_URL;

      await auth.api.sendVerificationEmail({
        body: {
          email: target.email,
          callbackURL: `${dashboardUrl}/dashboard`,
        },
        headers: ctx.headers,
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

      return { success: true };
    }),
});
