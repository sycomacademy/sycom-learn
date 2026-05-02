import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { z } from "zod";

export const feedbackReportStatusSchema = z.enum(["pending", "in_progress", "resolved", "closed"]);
export type FeedbackReportStatus = z.infer<typeof feedbackReportStatusSchema>;

export const REPORT_STATUS_LABELS: Record<FeedbackReportStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const REPORT_STATUS_CONFIG = {
  pending: { label: REPORT_STATUS_LABELS.pending, variant: "warning" },
  in_progress: { label: REPORT_STATUS_LABELS.in_progress, variant: "secondary" },
  resolved: { label: REPORT_STATUS_LABELS.resolved, variant: "success" },
  closed: { label: REPORT_STATUS_LABELS.closed, variant: "outline" },
} as const;

export const feedbackReportTypeSchema = z.enum(["bug", "feature", "complaint", "other"]);
export type FeedbackReportType = z.infer<typeof feedbackReportTypeSchema>;

export const REPORT_TYPE_LABELS: Record<FeedbackReportType, string> = {
  bug: "Bug",
  feature: "Feature request",
  complaint: "Complaint",
  other: "Other",
};

export const listAdminReportsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  statuses: z.array(feedbackReportStatusSchema).optional(),
  types: z.array(feedbackReportTypeSchema).optional(),
  sortBy: z.enum(["submittedAt"]).default("submittedAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListAdminReportsInput = z.infer<typeof listAdminReportsSchema>;
export type ReportsSortField = ListAdminReportsInput["sortBy"];
export type ReportRow = AppRouterOutputs["feedback"]["listReports"]["rows"][number];
