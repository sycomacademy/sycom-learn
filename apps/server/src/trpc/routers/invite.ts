import { auth } from "@sycom/auth";
import {
  getPlatformInvitationByTokenHash,
  getPlatformUserByEmail,
  markPlatformInvitationAccepted,
  markPlatformInvitationRejected,
} from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";
import { createHash } from "node:crypto";

import { publicProcedure, router } from "../init";
import {
  acceptPlatformInvitationSchema,
  getPlatformInvitationByTokenSchema,
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

    return { success: true };
  }),
});
