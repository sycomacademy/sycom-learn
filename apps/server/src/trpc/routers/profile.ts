import { auth } from "@sycom/auth";
import {
  getProfileByUserId,
  listPasskeysByUserId,
  upsertProfileByUserId,
} from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../init";

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

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  revokeOtherSessions: z.boolean().optional(),
});
type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

const revokeSessionSchema = z.object({
  token: z.string().min(1),
});
type RevokeSessionInput = z.infer<typeof revokeSessionSchema>;

const passkeyListItemSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  createdAt: z.date(),
});
type PasskeyListItem = z.infer<typeof passkeyListItemSchema>;

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
    const userId = ctx.session.user.id;
    const passkeys = await listPasskeysByUserId(ctx.db, { userId });
    const parsedPasskeys: PasskeyListItem[] = passkeyListItemSchema.array().parse(passkeys);

    return parsedPasskeys;
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
