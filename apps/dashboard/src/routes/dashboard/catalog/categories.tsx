import { useInfiniteQuery, useIsFetching } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo } from "react";

import {
  CreateCategoryDialog,
  CategoryListItem,
} from "@/components/dashboard/catalog/category-form-dialog";
import {
  categoriesSearchSchema,
  categoryListPageSize,
  getCategoriesListInput,
  type CategoriesSearchInput,
} from "@/components/dashboard/catalog/categories-schema";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useTRPC, useTRPCClient } from "@/lib/trpc/client";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@sycom/ui/components/input-group";
import { Spinner } from "@sycom/ui/components/spinner";

export const Route = createFileRoute("/dashboard/catalog/categories")({
  validateSearch: categoriesSearchSchema,
  component: CatalogCategoriesPage,
});

function CatalogCategoriesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const { searchInput, setSearchInput } = useDebouncedSearch({
    committedValue: search.search,
    delayMs: 300,
    onDebouncedCommit: (next) =>
      navigate({
        replace: true,
        search: (_prev: CategoriesSearchInput) => ({ search: next }),
      }),
  });

  const infiniteQuery = useInfiniteQuery({
    initialPageParam: 0,
    queryKey: [...trpc.catalog.listCategories.queryKey(), search.search ?? ""],
    queryFn: async ({ pageParam }) =>
      await trpcClient.catalog.listCategories.query(getCategoriesListInput(search, pageParam)),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.rows.length, 0);
      if (loaded >= lastPage.totalCount || lastPage.rows.length < categoryListPageSize) {
        return undefined;
      }
      return loaded;
    },
  });

  const isFetching = useIsFetching({ queryKey: trpc.catalog.listCategories.queryKey() }) > 0;
  const categories = useMemo(
    () => infiniteQuery.data?.pages.flatMap((page) => page.rows) ?? [],
    [infiniteQuery.data],
  );

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Categories</h2>
          <p className="text-sm text-muted-foreground">Tags used to organize the public catalog.</p>
        </div>

        <CreateCategoryDialog />
      </div>

      <div className="min-w-0">
        <label className="sr-only" htmlFor="categories-search">
          Search categories by name or slug
        </label>
        <InputGroup className="w-full max-w-md">
          <InputGroupAddon align="inline-start">
            {isFetching ? <Spinner className="size-4" /> : <Search className="size-4 opacity-60" />}
          </InputGroupAddon>
          <InputGroupInput
            id="categories-search"
            onChange={(event) => setSearchInput(event.currentTarget.value)}
            placeholder="Search by name or slug..."
            type="search"
            value={searchInput}
          />
        </InputGroup>
      </div>

      <div
        className="max-h-[calc(100vh-16rem)] space-y-3 overflow-y-auto pe-1"
        onScroll={(event) => {
          const currentTarget = event.currentTarget;
          const remaining =
            currentTarget.scrollHeight - currentTarget.scrollTop - currentTarget.clientHeight;
          if (
            remaining < 160 &&
            infiniteQuery.hasNextPage &&
            !infiniteQuery.isFetchingNextPage &&
            infiniteQuery.status === "success"
          ) {
            void infiniteQuery.fetchNextPage();
          }
        }}
      >
        {infiniteQuery.status === "pending" ? (
          <div className="flex min-h-40 items-center justify-center rounded-lg border bg-card">
            <Spinner className="size-5" />
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-lg border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
            No categories found.
          </div>
        ) : (
          categories.map((category) => <CategoryListItem category={category} key={category.id} />)
        )}

        <div className="flex h-12 items-center justify-center">
          {infiniteQuery.isFetchingNextPage ? <Spinner className="size-4" /> : null}
        </div>

        {infiniteQuery.status === "error" ? (
          <div className="rounded-lg border border-destructive/30 bg-card px-4 py-3 text-sm text-destructive">
            {infiniteQuery.error.message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
