import { auth } from "@sycom/auth";
import {
  getOrganizationInvitationByTokenHash,
  getPlatformInvitationByTokenHash,
  getPlatformUserByEmail,
  insertOrganizationOwnerMember,
  markOrganizationInvitationAccepted,
  markOrganizationInvitationRejected,
  markPlatformInvitationAccepted,
  markPlatformInvitationRejected,
} from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";
import { createHash } from "node:crypto";

import { publicProcedure, router } from "../init";
import { audit } from "../utils/audit";
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

    await audit(ctx, {
      event: "platform_invite.accepted",
      entityType: "platform_invitation",
      entityId: invitation.id,
      metadata: { acceptedUserId: createdUser.user.id, email: invitation.email },
    });

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

    await audit(ctx, {
      event: "platform_invite.rejected",
      entityType: "platform_invitation",
      entityId: invitation.id,
      metadata: { email: invitation.email },
    });

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

      return invitation;
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

      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "An account with this email already exists. Sign in and open Organisation setup.",
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

      await insertOrganizationOwnerMember(ctx.db, {
        organizationId: invitation.organizationId,
        userId: createdUser.user.id,
      });

      const updated = await markOrganizationInvitationAccepted(ctx.db, {
        invitationId: invitation.id,
      });

      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not finalize this invitation. Try again.",
        });
      }

      await audit(ctx, {
        event: "org.invitation.accepted",
        entityType: "invitation",
        entityId: invitation.id,
        organizationId: invitation.organizationId,
        metadata: {
          acceptedUserId: createdUser.user.id,
          email: invitation.email,
          role: invitation.role,
        },
      });

      return { success: true };
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

      await audit(ctx, {
        event: "org.invitation.rejected",
        entityType: "invitation",
        entityId: invitation.id,
        organizationId: invitation.organizationId,
        metadata: { email: invitation.email },
      });

      return { success: true };
    }),
});
