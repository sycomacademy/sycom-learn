import { auth } from "@sycom/auth";
import { getProfileByUserId } from "@sycom/db/queries/index";
import { z } from "zod";

import { protectedProcedure, router } from "../init";

const updateAvatarSchema = z.object({
  publicId: z.string().min(1),
});
type UpdateAvatarInput = z.infer<typeof updateAvatarSchema>;

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

  updateAvatar: protectedProcedure.input(updateAvatarSchema).mutation(async ({ ctx, input }) => {
    const mutationInput: UpdateAvatarInput = input;

    await auth.api.updateUser({
      body: { image: mutationInput.publicId },
      headers: ctx.headers,
    });

    return { publicId: mutationInput.publicId };
  }),
});
