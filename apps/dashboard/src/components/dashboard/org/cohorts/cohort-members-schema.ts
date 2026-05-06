import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { z } from "zod";

export const cohortMembersPageSize = 20;

export const cohortMembersSearchSchema = z.object({
  search: z.string().check(z.maxLength(100)).optional(),
  limit: z.number().int().min(1).max(100).default(cohortMembersPageSize),
  offset: z.number().int().min(0).default(0),
});

export type CohortMembersSearchInput = z.infer<typeof cohortMembersSearchSchema>;

export type CohortMemberRow = AppRouterOutputs["organization"]["listCohortMembers"]["rows"][number];

export function getCohortMembersListInput(input: {
  cohortId: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return {
    cohortId: input.cohortId,
    search: input.search?.trim() || undefined,
    limit: input.limit ?? cohortMembersPageSize,
    offset: input.offset ?? 0,
  };
}
