import {
  createFeedback,
  createFeedbackReport,
  listAdminFeedback,
  listAdminReports,
  updateAdminReportStatus,
} from "@sycom/db/queries/index";
import { TRPCError } from "@trpc/server";

import { adminProcedure, protectedProcedure, router } from "../init";
import {
  listAdminFeedbackSchema,
  listAdminReportsSchema,
  submitFeedbackReportSchema,
  submitFeedbackSchema,
  updateAdminReportStatusSchema,
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
    .use(platformPermissionMiddleware({ report: ["submit"] }))
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

  listFeedback: adminProcedure
    .use(platformPermissionMiddleware({ feedback: ["list"] }))
    .input(listAdminFeedbackSchema)
    .query(async ({ ctx, input }) => {
      return await listAdminFeedback(ctx.db, input);
    }),

  listReports: adminProcedure
    .use(platformPermissionMiddleware({ report: ["list"] }))
    .input(listAdminReportsSchema)
    .query(async ({ ctx, input }) => {
      return await listAdminReports(ctx.db, input);
    }),

  updateReportStatus: adminProcedure
    .use(platformPermissionMiddleware({ report: ["update"] }))
    .input(updateAdminReportStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const report = await updateAdminReportStatus(ctx.db, input);

      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
      }

      return report;
    }),
});
