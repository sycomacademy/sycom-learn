import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@sycom/ui/components/button";

const LIST_INPUT = {
  limit: 200,
  offset: 0,
  sortBy: "name",
  sortDirection: "asc",
} as const;

export const Route = createFileRoute("/dashboard/catalog/categories")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.catalog.listCategories.queryOptions(LIST_INPUT),
    );
  },
  component: CatalogCategoriesPage,
});

function CatalogCategoriesPage() {
  // const trpc = useTRPC();
  // const queryClient = useQueryClient();
  // const query = useQuery(trpc.catalog.listCategories.queryOptions(LIST_INPUT));

  // const deleteMutation = useMutation({
  //   ...trpc.catalog.deleteCategory.mutationOptions({
  //     onSuccess: async () => {
  //       toastManager.add({ title: "Category deleted", type: "success" });
  //       await queryClient.invalidateQueries({ queryKey: trpc.catalog.listCategories.queryKey() });
  //     },
  //     onError: (error) =>
  //       toastManager.add({
  //         title: "Couldn't delete category",
  //         description: error.message,
  //         type: "error",
  //       }),
  //   }),
  // });

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Categories</h2>
          <p className="text-sm text-muted-foreground">Tags used to organize the public catalog.</p>
        </div>
        <Button>
          <Plus className="size-4" />
          New category
        </Button>
      </div>
    </div>
  );
}
