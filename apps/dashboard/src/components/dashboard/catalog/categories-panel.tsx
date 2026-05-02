import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { useTRPC } from "@/lib/trpc/client";
import { Button } from "@sycom/ui/components/button";
import { FilterCombobox, type FilterOption } from "@sycom/ui/components/filter-combobox";
import { Spinner } from "@sycom/ui/components/spinner";
import { toastManager } from "@sycom/ui/components/toast";

type CourseDetail = AppRouterOutputs["catalog"]["get"];

export function CategoriesPanel({ course }: { course: CourseDetail }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>(() => course.categories.map((c) => c.id));

  useEffect(() => {
    setSelected(course.categories.map((c) => c.id));
  }, [course.categories]);

  const categoriesQuery = useQuery(
    trpc.catalog.listCategories.queryOptions({
      limit: 200,
      offset: 0,
      sortBy: "name",
      sortDirection: "asc",
    }),
  );

  const setMutation = useMutation({
    ...trpc.catalog.setCategories.mutationOptions({
      onSuccess: async () => {
        toastManager.add({ title: "Categories saved", type: "success" });
        await queryClient.invalidateQueries({
          queryKey: trpc.catalog.get.queryKey({ courseId: course.id }),
        });
      },
      onError: (error) =>
        toastManager.add({
          title: "Couldn't save categories",
          description: error.message,
          type: "error",
        }),
    }),
  });

  const options: FilterOption[] = (categoriesQuery.data?.rows ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const initialIds = course.categories
    .map((c) => c.id)
    .sort()
    .join(",");
  const selectedIds = selected.toSorted().join(",");
  const isDirty = initialIds !== selectedIds;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-sm font-medium">Categories</h3>
      {categoriesQuery.isLoading ? (
        <div className="flex min-h-16 items-center justify-center">
          <Spinner className="size-5" />
        </div>
      ) : options.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No categories defined yet. Create some on the Categories tab.
        </p>
      ) : (
        <div className="space-y-3">
          <FilterCombobox
            allLabel="No categories"
            label="Categories"
            onValueChange={setSelected}
            options={options}
            resetWhenAllSelected={false}
            value={selected}
          />
          <div className="flex justify-end">
            <Button
              disabled={!isDirty}
              loading={setMutation.isPending}
              onClick={() => setMutation.mutate({ courseId: course.id, categoryIds: selected })}
              size="sm"
            >
              Save categories
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
