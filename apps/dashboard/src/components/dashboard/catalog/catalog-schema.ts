import { DIFFICULTY_LEVELS, type DifficultyLevel } from "@sycom/db/schema/course";
import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { z } from "zod";

export const listCatalogSearchSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().trim().min(1).optional(),
  difficulties: z.array(z.enum(DIFFICULTY_LEVELS)).optional(),
  categoryIds: z.array(z.string().min(1)).optional(),
  enrolledOnly: z.boolean().optional(),
  view: z.enum(["list", "cards"]).default("cards"),
  sortBy: z.enum(["title", "updatedAt", "difficulty"]).default("updatedAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export type ListCatalogSearchInput = z.infer<typeof listCatalogSearchSchema>;
export type CatalogViewMode = ListCatalogSearchInput["view"];
export type CatalogSortField = ListCatalogSearchInput["sortBy"];
export type CatalogRow = AppRouterOutputs["catalog"]["list"]["rows"][number];
export type { DifficultyLevel };

export const COURSE_DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

export function getCatalogListQueryInput(input: ListCatalogSearchInput) {
  const { view: _view, ...queryInput } = input;
  return queryInput;
}

export function formatMinutes(total: number): string {
  if (total <= 0) {
    return "—";
  }
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) {
    return `${m} min`;
  }
  if (m === 0) {
    return `${h}h`;
  }
  return `${h}h ${m}m`;
}
