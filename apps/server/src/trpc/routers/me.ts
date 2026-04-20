import { auth } from "@sycom/auth";
import { user } from "@sycom/db/schema/auth";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../init";

const updateMeSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
});

export const meRouter = router({
  get: protectedProcedure.query(({ ctx }) => ctx.session.user),
  update: protectedProcedure.input(updateMeSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    if (input.name !== undefined) {
      await ctx.db
        .update(user)
        .set({ name: input.name, updatedAt: new Date() })
        .where(eq(user.id, userId));
    }

    const [row] = await ctx.db.select().from(user).where(eq(user.id, userId)).limit(1);
    if (!row) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return row;
  }),
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await auth.api.changePassword({
          body: {
            currentPassword: input.currentPassword,
            newPassword: input.newPassword,
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
