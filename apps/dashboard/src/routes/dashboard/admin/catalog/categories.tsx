import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PencilIcon, Plus, Trash2Icon } from "lucide-react";
import { useState } from "react";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { CategoryFormDialog } from "@/components/dashboard/catalog/category-form-dialog";
import { useTRPC } from "@/lib/trpc/client";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@sycom/ui/components/alert-dialog";
import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";
import { Spinner } from "@sycom/ui/components/spinner";
import { toastManager } from "@sycom/ui/components/toast";

type CategoryRow = AppRouterOutputs["catalog"]["listCategories"]["rows"][number];

const LIST_INPUT = {
  limit: 200,
  offset: 0,
  sortBy: "name",
  sortDirection: "asc",
} as const;

export const Route = createFileRoute("/dashboard/admin/catalog/categories")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.catalog.listCategories.queryOptions(LIST_INPUT),
    );
  },
  component: CatalogCategoriesPage,
});

function CatalogCategoriesPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | undefined>(undefined);
  const [deleting, setDeleting] = useState<CategoryRow | undefined>(undefined);

  const query = useQuery(trpc.catalog.listCategories.queryOptions(LIST_INPUT));

  const deleteMutation = useMutation({
    ...trpc.catalog.deleteCategory.mutationOptions({
      onSuccess: async () => {
        toastManager.add({ title: "Category deleted", type: "success" });
        setDeleting(undefined);
        await queryClient.invalidateQueries({ queryKey: trpc.catalog.listCategories.queryKey() });
      },
      onError: (error) =>
        toastManager.add({
          title: "Couldn't delete category",
          description: error.message,
          type: "error",
        }),
    }),
  });

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Categories</h2>
          <p className="text-xs text-muted-foreground">Tags used to organize the public catalog.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New category
        </Button>
      </div>

      {query.isLoading ? (
        <div className="flex min-h-32 items-center justify-center">
          <Spinner className="size-5" />
        </div>
      ) : (query.data?.rows ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
          <p className="text-sm font-medium">No categories yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Create one to start tagging courses.</p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {(query.data?.rows ?? []).map((category) => (
            <li className="flex items-center gap-3 px-4 py-3" key={category.id}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{category.name}</p>
                <p className="truncate text-xs text-muted-foreground">{category.slug}</p>
              </div>
              <Badge size="sm" variant="outline">
                {category.courseCount} course{category.courseCount === 1 ? "" : "s"}
              </Badge>
              <Button
                aria-label={`Edit ${category.name}`}
                onClick={() => setEditing(category)}
                size="icon-sm"
                variant="ghost"
              >
                <PencilIcon className="size-4" />
              </Button>
              <Button
                aria-label={`Delete ${category.name}`}
                onClick={() => setDeleting(category)}
                size="icon-sm"
                variant="ghost"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <CategoryFormDialog onOpenChange={setCreateOpen} open={createOpen} />
      <CategoryFormDialog
        category={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
        }}
        open={Boolean(editing)}
      />

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setDeleting(undefined);
        }}
        open={Boolean(deleting)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? (
                <>
                  This permanently removes <strong>{deleting.name}</strong> from the catalog
                  taxonomy.{" "}
                  {deleting.courseCount > 0
                    ? `${deleting.courseCount} course${deleting.courseCount === 1 ? "" : "s"} will be unlinked.`
                    : ""}
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
            <Button
              loading={deleteMutation.isPending}
              onClick={() => deleting && deleteMutation.mutate({ categoryId: deleting.id })}
              variant="destructive"
            >
              Delete category
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
