import { useIsFetching, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useCallback, useMemo, useRef } from "react";

import {
  CreateCategoryDialog,
  CategoryListItem,
} from "@/components/dashboard/course/category-form-dialog";
import {
  categoriesSearchSchema,
  categoryListPageSize,
  getCategoriesListInput,
  type CategoryRow,
  type CategoriesSearchInput,
} from "@/components/dashboard/course/categories-schema";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useTRPC } from "@/lib/trpc/client";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@sycom/ui/components/input-group";
import { Spinner } from "@sycom/ui/components/spinner";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

type CategoryListResult = AppRouterOutputs["course"]["listCategories"];

function getCategoryInfiniteQueryOptions(
  trpc: Pick<ReturnType<typeof useTRPC>, "course">,
  search: CategoriesSearchInput,
) {
  return {
    initialPageParam: 0,
    queryKey: [...trpc.course.listCategories.queryKey(), search.search ?? ""],
    queryFn: async (context: unknown): Promise<CategoryListResult> => {
      const pageParam = (context as { pageParam: number }).pageParam;
      const queryOptions = trpc.course.listCategories.queryOptions(
        getCategoriesListInput(search, pageParam),
      );
      const queryFn = queryOptions.queryFn;
      if (!queryFn) {
        throw new Error("Missing query function for course.listCategories.");
      }

      type QueryContext = Parameters<NonNullable<typeof queryFn>>[0];
      return await queryFn({
        ...(context as Omit<QueryContext, "queryKey">),
        queryKey: queryOptions.queryKey,
      } as QueryContext);
    },
    getNextPageParam: (lastPage: CategoryListResult, allPages: CategoryListResult[]) => {
      const loaded = allPages.reduce((sum, page) => sum + page.rows.length, 0);
      if (loaded >= lastPage.totalCount || lastPage.rows.length < categoryListPageSize) {
        return undefined;
      }
      return loaded;
    },
  };
}

export const Route = createFileRoute("/dashboard/course/categories")({
  validateSearch: categoriesSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const trpc = context.trpc;
    await context.queryClient.ensureInfiniteQueryData({
      initialPageParam: 0,
      queryKey: [...trpc.course.listCategories.queryKey(), deps.search ?? ""],
      queryFn: async (context): Promise<CategoryListResult> => {
        const pageParam = context.pageParam as number;
        const queryOptions = trpc.course.listCategories.queryOptions(
          getCategoriesListInput(deps, pageParam),
        );
        const queryFn = queryOptions.queryFn;
        if (!queryFn) {
          throw new Error("Missing query function for course.listCategories.");
        }

        return await queryFn({
          ...context,
          queryKey: queryOptions.queryKey,
        });
      },
      getNextPageParam: (lastPage: CategoryListResult, allPages: CategoryListResult[]) => {
        const loaded = allPages.reduce((sum, page) => sum + page.rows.length, 0);
        if (loaded >= lastPage.totalCount || lastPage.rows.length < categoryListPageSize) {
          return undefined;
        }
        return loaded;
      },
    });
  },
  component: CourseCategoriesPage,
});

function CourseCategoriesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();
  const scrollHostRef = useRef<HTMLElement | null>(null);
  const detachScrollRef = useRef<(() => void) | null>(null);
  const { searchInput, setSearchInput } = useDebouncedSearch({
    committedValue: search.search,
    delayMs: 300,
    onDebouncedCommit: (next) =>
      navigate({
        replace: true,
        search: (_prev: CategoriesSearchInput) => ({ search: next }),
      }),
  });

  const infiniteQuery = useSuspenseInfiniteQuery(getCategoryInfiniteQueryOptions(trpc, search));

  const isFetching = useIsFetching({ queryKey: trpc.course.listCategories.queryKey() }) > 0;
  const categories = useMemo(
    () => infiniteQuery.data.pages.flatMap((page) => page.rows) as CategoryRow[],
    [infiniteQuery.data],
  );

  const handleScrollLoadMore = useCallback(() => {
    const scrollHost = scrollHostRef.current;
    if (!scrollHost) {
      return;
    }

    const remaining = scrollHost.scrollHeight - scrollHost.scrollTop - scrollHost.clientHeight;
    if (
      remaining < 240 &&
      infiniteQuery.hasNextPage &&
      !infiniteQuery.isFetchingNextPage &&
      infiniteQuery.status === "success"
    ) {
      void infiniteQuery.fetchNextPage();
    }
  }, [infiniteQuery]);

  const attachScrollHost = useCallback(
    (node: HTMLDivElement | null) => {
      detachScrollRef.current?.();
      detachScrollRef.current = null;
      scrollHostRef.current = null;

      if (!node) {
        return;
      }

      const scrollHost = node.closest<HTMLElement>("[role='main']");
      if (!scrollHost) {
        return;
      }

      scrollHostRef.current = scrollHost;
      const onScroll = () => handleScrollLoadMore();
      scrollHost.addEventListener("scroll", onScroll, { passive: true });
      detachScrollRef.current = () => scrollHost.removeEventListener("scroll", onScroll);
    },
    [handleScrollLoadMore],
  );

  return (
    <div className="flex flex-col gap-4 px-6 py-6" ref={attachScrollHost}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Categories</h2>
          <p className="text-sm text-muted-foreground">Tags used to organize public courses.</p>
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

      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="rounded-lg border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
            No categories found.
          </div>
        ) : (
          categories.map((category) => <CategoryListItem category={category} key={category.id} />)
        )}

        <div className="flex h-12 items-center justify-center">
          {infiniteQuery.isFetchingNextPage ? <Spinner className="size-4" /> : null}
        </div>
      </div>
    </div>
  );
}
