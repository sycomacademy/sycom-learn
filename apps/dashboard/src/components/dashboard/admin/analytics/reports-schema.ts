import { z } from "zod";

export const feedbackReportStatusSchema = z.enum(["pending", "in_progress", "resolved", "closed"]);
export type FeedbackReportStatus = z.infer<typeof feedbackReportStatusSchema>;

export const feedbackReportTypeSchema = z.enum(["bug", "feature", "complaint", "other"]);
export type FeedbackReportType = z.infer<typeof feedbackReportTypeSchema>;

export const listAdminReportsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  statuses: z.array(feedbackReportStatusSchema).optional(),
  types: z.array(feedbackReportTypeSchema).optional(),
  sortBy: z.enum(["submittedAt"]).default("submittedAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListAdminReportsInput = z.infer<typeof listAdminReportsSchema>;
