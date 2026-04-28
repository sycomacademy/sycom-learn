import { createFeedback, createFeedbackReport } from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";

import { protectedProcedure, router } from "../init";
import {
  submitFeedbackReportSchema,
  submitFeedbackSchema,
  type SubmitFeedbackInput,
  type SubmitFeedbackReportInput,
} from "../schemas";

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
  submitReport: protectedProcedure
    .input(submitFeedbackReportSchema)
    .mutation(async ({ ctx, input }) => {
      const mutationInput: SubmitFeedbackReportInput = input;
      const userId = ctx.session?.user.id ?? null;

      const feedbackReportRow = await createFeedbackReport(ctx.db, {
        id: mutationInput.reportId,
        userId,
        email: mutationInput.email,
        type: mutationInput.type,
        subject: mutationInput.subject,
        description: mutationInput.description,
        imageUrl: mutationInput.imageUrl,
        status: "pending",
      });

      if (!feedbackReportRow) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to submit report",
        });
      }

      return feedbackReportRow;
    }),
});
