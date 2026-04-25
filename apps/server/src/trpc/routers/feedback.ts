import { createFeedback } from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../init";

const submitFeedbackSchema = z.object({
  email: z.email(),
  message: z.string().trim().min(1).max(5000),
});
type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;

export const feedbackRouter = router({
  submit: protectedProcedure.input(submitFeedbackSchema).mutation(async ({ ctx, input }) => {
    const mutationInput: SubmitFeedbackInput = input;
    const userId = ctx.session?.user.id ?? null;

    const feedbackRow = await createFeedback(ctx.db, {
      userId,
      email: mutationInput.email,
      message: mutationInput.message,
    });

    if (!feedbackRow) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to submit feedback",
      });
    }

    return feedbackRow;
  }),
});
