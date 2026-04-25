import { auth } from "@sycom/auth";
import { createStorageEntry } from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { signAvatarUpload } from "../../lib/cloudinary";
import { protectedProcedure, router } from "../init";

const commitAvatarSchema = z.object({
  publicId: z.string().min(1),
  format: z.string().min(1),
  bytes: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  name: z.string().optional(),
});
type CommitAvatarInput = z.infer<typeof commitAvatarSchema>;

export const avatarRouter = router({
  createUploadSignature: protectedProcedure.mutation(({ ctx }) => {
    return signAvatarUpload({ userId: ctx.session.user.id });
  }),

  commit: protectedProcedure.input(commitAvatarSchema).mutation(async ({ ctx, input }) => {
    const mutationInput: CommitAvatarInput = input;
    const userId = ctx.session.user.id;
    const expectedPrefix = `users/${userId}/avatar/`;

    if (!mutationInput.publicId.startsWith(expectedPrefix)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "publicId outside user folder",
      });
    }

    const row = await createStorageEntry(ctx.db, {
      publicId: mutationInput.publicId,
      name: mutationInput.name ?? null,
      format: mutationInput.format,
      bytes: mutationInput.bytes,
      width: mutationInput.width,
      height: mutationInput.height,
      imageFor: "user_avatar",
      entityId: userId,
      uploadedBy: userId,
    });

    if (!row) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to record storage entry",
      });
    }

    await auth.api.updateUser({
      body: { image: mutationInput.publicId },
      headers: ctx.headers,
    });

    return { publicId: mutationInput.publicId };
  }),
});
