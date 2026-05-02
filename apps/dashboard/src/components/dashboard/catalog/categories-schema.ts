import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { z } from "zod";

export const categoryListPageSize = 20;

export const categoriesSearchSchema = z.object({
  search: z.string().check(z.maxLength(100)).optional(),
});

export type CategoriesSearchInput = z.infer<typeof categoriesSearchSchema>;
export type CategoryRow = AppRouterOutputs["catalog"]["listCategories"]["rows"][number];

export const categoryFormSchema = z.object({
  name: z.string().check(z.minLength(1, "Name is required"), z.maxLength(80)),
  slug: z
    .string()
    .check(
      z.minLength(2, "Slug must be at least 2 characters"),
      z.maxLength(60),
      z.regex(
        /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
        "Use lowercase letters, numbers, and hyphens only",
      ),
    ),
  order: z.string().check(z.maxLength(8)),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

export const DEFAULT_CATEGORY_FORM_VALUES: CategoryFormInput = {
  name: "",
  slug: "",
  order: "0",
};

export function getCategoryFormValues(category?: CategoryRow): CategoryFormInput {
  if (!category) {
    return DEFAULT_CATEGORY_FORM_VALUES;
  }

  return {
    name: category.name,
    slug: category.slug,
    order: String(category.order),
  };
}

export function getCategoriesListInput(search: CategoriesSearchInput, offset = 0) {
  return {
    limit: categoryListPageSize,
    offset,
    search: search.search?.trim() || undefined,
    sortBy: "name" as const,
    sortDirection: "asc" as const,
  };
}
