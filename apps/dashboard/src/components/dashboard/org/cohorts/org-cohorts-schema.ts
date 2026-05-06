import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { z } from "zod";

export const orgCohortListPageSize = 20;

export const orgCohortsSearchSchema = z.object({
  search: z.string().check(z.maxLength(100)).optional(),
});

export type OrgCohortsSearchInput = z.infer<typeof orgCohortsSearchSchema>;
export type OrgCohortRow = AppRouterOutputs["organization"]["listCohorts"]["rows"][number];

export function getOrgCohortsListInput(search: OrgCohortsSearchInput, offset = 0) {
  return {
    limit: orgCohortListPageSize,
    offset,
    search: search.search?.trim() || undefined,
    sortBy: "name" as const,
    sortDirection: "asc" as const,
  };
}
