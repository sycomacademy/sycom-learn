import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { z } from "zod";

export const listAdminFeedbackSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(["submittedAt"]).default("submittedAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});
export type ListAdminFeedbackInput = z.infer<typeof listAdminFeedbackSchema>;
export type FeedbackSortField = ListAdminFeedbackInput["sortBy"];
export type FeedbackRow = AppRouterOutputs["feedback"]["listFeedback"]["rows"][number];
