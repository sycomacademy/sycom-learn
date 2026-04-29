import type { FeedbackReportStatus, FeedbackReportType } from "./reports-schema";

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

export const REPORT_TYPE_LABELS: Record<FeedbackReportType, string> = {
  bug: "Bug",
  feature: "Feature request",
  complaint: "Complaint",
  other: "Other",
};
