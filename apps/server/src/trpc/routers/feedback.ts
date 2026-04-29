import { createFeedback, createFeedbackReport } from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";

import { protectedProcedure, router } from "../init";
import {
  submitFeedbackReportSchema,
  submitFeedbackSchema,
  type SubmitFeedbackInput,
  type SubmitFeedbackReportInput,
} from "../schemas";
import { platformPermissionMiddleware } from "../middleware/permissions";

export const feedbackRouter = router({
  submit: protectedProcedure
    .use(platformPermissionMiddleware({ feedback: ["submit"] }))
    .input(submitFeedbackSchema)
    .mutation(async ({ ctx, input }) => {
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
    .use(platformPermissionMiddleware({ feedback: ["submit-report"] }))
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

  // get: adminProcedure.use(platformPermissionMiddleware({ feedback: ["get"] })).input(getFeedbackSchema).query(async ({ ctx, input }) => {
  //   const feedbackRow = await getFeedback(ctx.db, input);

  //   if (!feedbackRow) {
  //     throw new TRPCError({ code: "NOT_FOUND", message: "Feedback not found" });
  //   }

  //   return feedbackRow;
  // }),

  // list: adminProcedure.use(platformPermissionMiddleware({ feedback: ["list"] })).input(listFeedbackSchema).query(async ({ ctx, input }) => {
  //   const feedbackRows = await listFeedback(ctx.db, input);

  //   return feedbackRows;
  // }),

  // update: adminProcedure.use(platformPermissionMiddleware({ feedback: ["update"] })).input(updateFeedbackSchema).mutation(async ({ ctx, input }) => {
  //   const feedbackRow = await updateFeedback(ctx.db, input);

  //   if (!feedbackRow) {
  //     throw new TRPCError({ code: "NOT_FOUND", message: "Feedback not found" });
  //   }
  // }),

  // delete: adminProcedure.use(platformPermissionMiddleware({ feedback: ["delete"] })).input(deleteFeedbackSchema).mutation(async ({ ctx, input }) => {
  //   const feedbackRow = await deleteFeedback(ctx.db, input);

  //   if (!feedbackRow) {
  //     throw new TRPCError({ code: "NOT_FOUND", message: "Feedback not found" });
  //   }
  // }),
});
