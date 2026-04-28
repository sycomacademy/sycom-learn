import { auth } from "@sycom/auth";
import { getProfileByUserId, upsertProfileByUserId } from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";

import { protectedProcedure, router } from "../init";
import {
  changePasswordSchema,
  revokeSessionSchema,
  updateAvatarSchema,
  updateNameSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type RevokeSessionInput,
  type UpdateAvatarInput,
  type UpdateNameInput,
  type UpdateProfileInput,
} from "../schemas";

export const profileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const profile = await getProfileByUserId(ctx.db, { userId });

    return {
      session: ctx.session.session,
      user: ctx.session.user,
      profile,
    };
  }),

  updateName: protectedProcedure.input(updateNameSchema).mutation(async ({ ctx, input }) => {
    const mutationInput: UpdateNameInput = input;
    const { status } = await auth.api.updateUser({
      body: { name: mutationInput.name },
      headers: ctx.headers,
    });
    if (!status) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update name" });
    }
    return { success: true };
  }),

  updateAvatar: protectedProcedure.input(updateAvatarSchema).mutation(async ({ ctx, input }) => {
    const mutationInput: UpdateAvatarInput = input;

    await auth.api.updateUser({
      body: { image: mutationInput.publicId },
      headers: ctx.headers,
    });

    return { publicId: mutationInput.publicId };
  }),

  updateProfile: protectedProcedure.input(updateProfileSchema).mutation(async ({ ctx, input }) => {
    const mutationInput: UpdateProfileInput = input;
    const userId = ctx.session.user.id;

    const profile = await upsertProfileByUserId(ctx.db, {
      userId,
      ...mutationInput,
    });

    if (!profile) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update profile",
      });
    }

    return profile;
  }),

  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const mutationInput: ChangePasswordInput = input;
      await auth.api.changePassword({
        body: mutationInput,
        headers: ctx.headers,
      });
      return { success: true };
    }),

  listAccounts: protectedProcedure.query(async ({ ctx }) => {
    return await auth.api.listUserAccounts({ headers: ctx.headers });
  }),

  listSessions: protectedProcedure.query(async ({ ctx }) => {
    return await auth.api.listSessions({ headers: ctx.headers });
  }),

  listPasskeys: protectedProcedure.query(async ({ ctx }) => {
    return await auth.api.listPasskeys({ headers: ctx.headers });
  }),

  revokeSession: protectedProcedure.input(revokeSessionSchema).mutation(async ({ ctx, input }) => {
    const mutationInput: RevokeSessionInput = input;
    await auth.api.revokeSession({
      body: { token: mutationInput.token },
      headers: ctx.headers,
    });
    return { success: true };
  }),
});
