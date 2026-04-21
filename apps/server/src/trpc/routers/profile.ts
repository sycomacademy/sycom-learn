import { auth } from "@sycom/auth";
import { getProfileByUserId, getUserById, updateUserNameById } from "@sycom/db/queries/index";
import type { Profile } from "@sycom/db/schema/profile";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../init";

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
});
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});
type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
type ProfileGetOutput = {
  profile: Profile | null;
  session: typeof auth.$Infer.Session.session;
  user: typeof auth.$Infer.Session.user;
};

export const profileRouter = router({
  get: protectedProcedure.query(async ({ ctx }): Promise<ProfileGetOutput> => {
    const userId = ctx.session.user.id;
    const profile = await getProfileByUserId(ctx.db, { userId });

    return {
      session: ctx.session.session,
      user: ctx.session.user,
      profile,
    };
  }),
  update: protectedProcedure.input(updateProfileSchema).mutation(async ({ ctx, input }) => {
    const mutationInput: UpdateProfileInput = input;
    const userId = ctx.session.user.id;

    if (mutationInput.name !== undefined) {
      await updateUserNameById({ id: userId, name: mutationInput.name }, ctx.db);
    }

    const user = await getUserById(userId, ctx.db);
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return user;
  }),
  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const mutationInput: ChangePasswordInput = input;

      try {
        await auth.api.changePassword({
          body: {
            currentPassword: mutationInput.currentPassword,
            newPassword: mutationInput.newPassword,
          },
          headers: ctx.headers,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not change password";
        throw new TRPCError({
          code: "BAD_REQUEST",
          message,
        });
      }
    }),
});
