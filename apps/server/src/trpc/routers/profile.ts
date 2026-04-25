import { auth } from "@sycom/auth";
import { getProfileByUserId, upsertProfileByUserId } from "@sycom/db/queries/index";
import { z } from "zod";

import { protectedProcedure, router } from "../init";
import { TRPCError } from "@trpc/server";

const profileSettingsSchema = z.object({
  enableFacehash: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  useDeviceTimezone: z.boolean().optional(),
});

export const profileSelectSchema = z.object({
  userId: z.string(),
  onboardedAt: z.date().nullable(),
  bio: z.string().nullable(),
  settings: profileSettingsSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ProfileSelect = z.infer<typeof profileSelectSchema>;

const updateNameSchema = z.object({
  name: z.string().min(1),
});
type UpdateNameInput = z.infer<typeof updateNameSchema>;

const updateAvatarSchema = z.object({
  publicId: z.string().min(1),
});
type UpdateAvatarInput = z.infer<typeof updateAvatarSchema>;

const updateProfileSchema = profileSelectSchema
  .pick({
    onboardedAt: true,
    bio: true,
    settings: true,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one profile field to update",
  });
type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

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
});
