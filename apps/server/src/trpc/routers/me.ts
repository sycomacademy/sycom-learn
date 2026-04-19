import { z } from "zod";

import { protectedProcedure, router } from "../init";

const updateMeSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
});

export const meRouter = router({
  get: protectedProcedure.query(({ ctx }) => ctx.session.user),
  update: protectedProcedure
    .input(updateMeSchema)
    .mutation(({ ctx, input }) => ({ ...ctx.session.user, ...input })),
});
