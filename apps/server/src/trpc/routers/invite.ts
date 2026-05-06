import { auth } from "@sycom/auth";
import {
  findOrganizationMembershipByEmail,
  getOrganizationInvitationByTokenHash,
  getPlatformInvitationByTokenHash,
  getPlatformUserByEmail,
  insertOrganizationMember,
  insertOrganizationOwnerMember,
  markOrganizationInvitationAccepted,
  markOrganizationInvitationRejected,
  markPlatformInvitationAccepted,
  markPlatformInvitationRejected,
  recordApplicationAuditEvent,
} from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";
import { createHash } from "node:crypto";

import { publicProcedure, router } from "../init";
import { auditRequestMeta } from "../lib/request-audit";
import {
  acceptOrganizationInvitationSchema,
  acceptPlatformInvitationSchema,
  getOrganizationInvitationByTokenSchema,
  getPlatformInvitationByTokenSchema,
  rejectOrganizationInvitationSchema,
  rejectPlatformInvitationSchema,
} from "../schemas";

function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export const inviteRouter = router({
  getByToken: publicProcedure
    .input(getPlatformInvitationByTokenSchema)
    .query(async ({ ctx, input }) => {
      const invitation = await getPlatformInvitationByTokenHash(ctx.db, {
        tokenHash: hashInvitationToken(input.token),
      });

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
      }

      return invitation;
    }),

  accept: publicProcedure.input(acceptPlatformInvitationSchema).mutation(async ({ ctx, input }) => {
    const invitation = await getPlatformInvitationByTokenHash(ctx.db, {
      tokenHash: hashInvitationToken(input.token),
    });

    if (!invitation) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
    }

    if (invitation.status === "accepted") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This invitation has already been accepted.",
      });
    }

    if (invitation.status === "rejected") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This invitation has already been declined.",
      });
    }

    if (invitation.status === "revoked") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "This invitation has been revoked." });
    }

    if (invitation.status === "expired") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "This invitation has expired." });
    }

    const existingUser = await getPlatformUserByEmail(ctx.db, { email: invitation.email });

    if (existingUser) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "A user with this email already exists.",
      });
    }

    const createdUser = await auth.api.createUser({
      body: {
        email: invitation.email,
        name: invitation.name,
        password: input.password,
        role: invitation.role,
        data: {
          emailVerified: true,
        },
      },
    });

    await markPlatformInvitationAccepted(ctx.db, {
      invitationId: invitation.id,
      acceptedUserId: createdUser.user.id,
    });

    // Application audit only: public invites are Sycom `platform_invitation` + tRPC, not Better Auth HTTP.
    // (Platform accounts are still created via `auth.api.createUser`, which the plugin may log separately as `user_signed_up`.)
    {
      const { ip, userAgent } = auditRequestMeta(ctx);
      await recordApplicationAuditEvent(ctx.db, {
        event: "platform_invitation_accepted",
        eventTitle: "Platform Invitation Accepted",
        eventSubtitle: `${invitation.name} accepted invite`,
        actorId: createdUser.user.id,
        actorType: "user",
        organizationId: null,
        ip,
        userAgent,
        metadata: {
          userId: createdUser.user.id,
          userName: createdUser.user.name,
          userEmail: createdUser.user.email,
          invitationId: invitation.id,
          inviteEmail: invitation.email,
          inviteRole: invitation.role,
          inviterUserId: invitation.inviterUserId,
          inviterName: invitation.inviterName,
        },
      });
    }

    return { success: true };
  }),

  reject: publicProcedure.input(rejectPlatformInvitationSchema).mutation(async ({ ctx, input }) => {
    const invitation = await getPlatformInvitationByTokenHash(ctx.db, {
      tokenHash: hashInvitationToken(input.token),
    });

    if (!invitation) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
    }

    if (invitation.status === "accepted") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This invitation has already been accepted.",
      });
    }

    if (invitation.status === "rejected") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This invitation has already been declined.",
      });
    }

    if (invitation.status === "revoked") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "This invitation has been revoked." });
    }

    if (invitation.status === "expired") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "This invitation has expired." });
    }

    await markPlatformInvitationRejected(ctx.db, {
      invitationId: invitation.id,
    });

    // Application audit only: token-based decline has no Better Auth session; same custom invite pipeline as accept.
    {
      const { ip, userAgent } = auditRequestMeta(ctx);
      await recordApplicationAuditEvent(ctx.db, {
        event: "platform_invitation_rejected",
        eventTitle: "Platform Invitation Declined",
        eventSubtitle: `${invitation.name} declined invite`,
        actorId: null,
        actorType: "system",
        organizationId: null,
        ip,
        userAgent,
        metadata: {
          invitationId: invitation.id,
          userEmail: invitation.email,
          userName: invitation.name,
          inviterUserId: invitation.inviterUserId,
          inviterName: invitation.inviterName,
        },
      });
    }

    return { success: true };
  }),

  getOrganizationInviteByToken: publicProcedure
    .input(getOrganizationInvitationByTokenSchema)
    .query(async ({ ctx, input }) => {
      const invitation = await getOrganizationInvitationByTokenHash(ctx.db, {
        tokenHash: hashInvitationToken(input.token),
      });

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
      }

      const existingUser = await getPlatformUserByEmail(ctx.db, { email: invitation.email });

      return {
        ...invitation,
        requiresPassword: !existingUser,
      };
    }),

  acceptOrganizationInvite: publicProcedure
    .input(acceptOrganizationInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      const invitation = await getOrganizationInvitationByTokenHash(ctx.db, {
        tokenHash: hashInvitationToken(input.token),
      });

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
      }

      if (invitation.status === "accepted") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has already been accepted.",
        });
      }

      if (invitation.status === "rejected") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has already been declined.",
        });
      }

      if (invitation.status === "expired") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This invitation has expired." });
      }

      const existingUser = await getPlatformUserByEmail(ctx.db, {
        email: invitation.email,
      });

      const isOwnerInvite = invitation.role === "owner";

      if (isOwnerInvite) {
        if (existingUser) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "An account with this email already exists. Sign in and open Organization setup.",
          });
        }
      } else {
        if (!invitation.role) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This invitation is invalid.",
          });
        }
        if (existingUser) {
          const existingUserDisplayName = invitation.inviteeName?.trim() || invitation.email;
          const existingMembership = await findOrganizationMembershipByEmail(ctx.db, {
            organizationId: invitation.organizationId,
            email: invitation.email,
          });

          if (!existingMembership) {
            await insertOrganizationMember(ctx.db, {
              organizationId: invitation.organizationId,
              userId: existingUser.id,
              role: invitation.role,
            });
          }

          const updated = await markOrganizationInvitationAccepted(ctx.db, {
            invitationId: invitation.id,
          });

          if (!updated) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Could not finalize this invitation. Try again.",
            });
          }

          const { ip, userAgent } = auditRequestMeta(ctx);
          await recordApplicationAuditEvent(ctx.db, {
            event: "organization_invitation_accepted",
            eventTitle: "Organization Invitation Accepted",
            eventSubtitle: `${existingUserDisplayName} joined ${invitation.organizationName} as ${invitation.role}`,
            actorId: existingUser.id,
            actorType: "user",
            organizationId: invitation.organizationId,
            ip,
            userAgent,
            metadata: {
              userId: existingUser.id,
              userName: existingUserDisplayName,
              userEmail: existingUser.email,
              invitationId: invitation.id,
              inviteEmail: invitation.email,
              organizationId: invitation.organizationId,
              organizationName: invitation.organizationName,
              organizationSlug: invitation.organizationSlug,
              inviterName: invitation.inviterName,
              organizationRole: invitation.role,
              inviteKind: "member",
              acceptedWithExistingAccount: true,
            },
          });

          return {
            success: true as const,
            organizationId: invitation.organizationId,
            organizationSlug: invitation.organizationSlug,
          };
        }
      }

      if (!input.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Password is required to accept this invitation.",
        });
      }

      const displayName =
        invitation.inviteeName?.trim() || invitation.email.split("@")[0] || "User";

      const createdUser = await auth.api.createUser({
        body: {
          email: invitation.email,
          name: displayName,
          password: input.password,
          role: "public_student",
          data: {
            emailVerified: true,
          },
        },
      });

      if (isOwnerInvite) {
        await insertOrganizationOwnerMember(ctx.db, {
          organizationId: invitation.organizationId,
          userId: createdUser.user.id,
        });
      } else {
        await insertOrganizationMember(ctx.db, {
          organizationId: invitation.organizationId,
          userId: createdUser.user.id,
          role: invitation.role as NonNullable<typeof invitation.role>,
        });
      }

      const updated = await markOrganizationInvitationAccepted(ctx.db, {
        invitationId: invitation.id,
      });

      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not finalize this invitation. Try again.",
        });
      }

      // Application audit only: org-owner invites use Sycom `invitation` rows + tRPC (not `POST /organization/accept-invitation`).
      {
        const { ip, userAgent } = auditRequestMeta(ctx);
        await recordApplicationAuditEvent(ctx.db, {
          event: "organization_invitation_accepted",
          eventTitle: "Organization Invitation Accepted",
          eventSubtitle: isOwnerInvite
            ? `${displayName} joined ${invitation.organizationName}`
            : `${displayName} joined ${invitation.organizationName} as ${invitation.role}`,
          actorId: createdUser.user.id,
          actorType: "user",
          organizationId: invitation.organizationId,
          ip,
          userAgent,
          metadata: {
            userId: createdUser.user.id,
            userName: createdUser.user.name,
            userEmail: createdUser.user.email,
            invitationId: invitation.id,
            inviteEmail: invitation.email,
            organizationId: invitation.organizationId,
            organizationName: invitation.organizationName,
            organizationSlug: invitation.organizationSlug,
            inviterName: invitation.inviterName,
            organizationRole: invitation.role,
            inviteKind: isOwnerInvite ? "owner" : "member",
          },
        });
      }

      return {
        success: true as const,
        organizationId: invitation.organizationId,
        organizationSlug: invitation.organizationSlug,
      };
    }),

  rejectOrganizationInvite: publicProcedure
    .input(rejectOrganizationInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      const invitation = await getOrganizationInvitationByTokenHash(ctx.db, {
        tokenHash: hashInvitationToken(input.token),
      });

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
      }

      if (invitation.status === "accepted") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has already been accepted.",
        });
      }

      if (invitation.status === "rejected") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has already been declined.",
        });
      }

      if (invitation.status === "expired") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This invitation has expired." });
      }

      await markOrganizationInvitationRejected(ctx.db, {
        invitationId: invitation.id,
      });

      // Application audit only: org-owner invite rejection is tRPC + DB, not a Better Auth organization-plugin route.
      {
        const { ip, userAgent } = auditRequestMeta(ctx);
        await recordApplicationAuditEvent(ctx.db, {
          event: "organization_invitation_rejected",
          eventTitle: "Organization Invitation Declined",
          eventSubtitle: `Invite to ${invitation.organizationName} was declined`,
          actorId: null,
          actorType: "system",
          organizationId: invitation.organizationId,
          ip,
          userAgent,
          metadata: {
            invitationId: invitation.id,
            userEmail: invitation.email,
            userName: invitation.inviteeName,
            organizationId: invitation.organizationId,
            organizationName: invitation.organizationName,
            organizationSlug: invitation.organizationSlug,
            inviterName: invitation.inviterName,
          },
        });
      }

      return { success: true };
    }),
});
