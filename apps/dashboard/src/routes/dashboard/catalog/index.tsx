import { useIsFetching, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo } from "react";

import { CatalogCardGrid } from "@/components/dashboard/catalog/catalog-card-grid";
import { CATALOG_COLUMNS } from "@/components/dashboard/catalog/catalog-columns";
import { CatalogFilters } from "@/components/dashboard/catalog/catalog-filters";
import {
  getCatalogListQueryInput,
  listCatalogSearchSchema,
  type CatalogRow,
  type CatalogSortField,
  type CatalogViewMode,
  type DifficultyLevel,
  type ListCatalogSearchInput,
} from "@/components/dashboard/catalog/catalog-schema";
import { CatalogToolbar } from "@/components/dashboard/catalog/catalog-toolbar";
import { DataTable } from "@/components/dashboard/data-table";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useTRPC } from "@/lib/trpc/client";

export const Route = createFileRoute("/dashboard/catalog/")({
  validateSearch: listCatalogSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.catalog.list.queryOptions(getCatalogListQueryInput(deps)),
    );
    await context.queryClient.ensureQueryData(
      context.trpc.course.listCategories.queryOptions({
        limit: 200,
        offset: 0,
        sortBy: "name",
        sortDirection: "asc",
      }),
    );
  },
  component: CatalogListPage,
});

function CatalogListPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();
  const { searchInput, setSearchInput } = useDebouncedSearch({
    committedValue: search.search,
    delayMs: 600,
    onDebouncedCommit: (next) =>
      navigate({
        replace: true,
        search: (prev: ListCatalogSearchInput) => ({ ...prev, search: next, offset: 0 }),
      }),
  });

  const queryInput = useMemo(() => getCatalogListQueryInput(search), [search]);
  const query = useSuspenseQuery(trpc.catalog.list.queryOptions(queryInput));
  const isFetching = useIsFetching({ queryKey: trpc.catalog.list.queryKey() }) > 0;

  const tableState = useMemo(
    () => ({
      sorting: [{ id: search.sortBy, desc: search.sortDirection === "desc" }] as SortingState,
      pagination: {
        pageIndex: Math.floor(search.offset / search.limit),
        pageSize: search.limit,
      } as PaginationState,
      columnFilters: [
        ...(search.difficulties?.length ? [{ id: "difficulty", value: search.difficulties }] : []),
        ...(search.categoryIds?.length ? [{ id: "categories", value: search.categoryIds }] : []),
      ] as ColumnFiltersState,
    }),
    [search],
  );

  const table = useReactTable<CatalogRow>({
    data: query.data.rows,
    columns: CATALOG_COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    state: tableState,
    manualSorting: true,
    manualPagination: true,
    manualFiltering: true,
    rowCount: query.data.totalCount,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState.sorting) : updater;
      const first = next[0];

      navigate({
        search: (prev: ListCatalogSearchInput) => ({
          ...prev,
          sortBy: first ? (first.id as CatalogSortField) : "updatedAt",
          sortDirection: first ? (first.desc ? "desc" : "asc") : "desc",
          offset: 0,
        }),
      });
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState.pagination) : updater;

      navigate({
        search: (prev: ListCatalogSearchInput) => ({
          ...prev,
          offset: next.pageIndex * next.pageSize,
          limit: next.pageSize,
        }),
      });
    },
    onColumnFiltersChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState.columnFilters) : updater;
      const difficulties = next.find((f) => f.id === "difficulty")?.value as
        | DifficultyLevel[]
        | undefined;
      const categoryIds = next.find((f) => f.id === "categories")?.value as string[] | undefined;

      navigate({
        search: (prev: ListCatalogSearchInput) => ({
          ...prev,
          difficulties: difficulties?.length ? difficulties : undefined,
          categoryIds: categoryIds?.length ? categoryIds : undefined,
          offset: 0,
        }),
      });
    },
  });

  const pageIndex = tableState.pagination.pageIndex;
  const pageSize = tableState.pagination.pageSize;

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Course catalog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse published courses and enroll to start learning.
        </p>
      </div>

      <CatalogToolbar
        enrolledOnly={search.enrolledOnly ?? false}
        isFetching={isFetching}
        onEnrolledOnlyChange={(next) =>
          navigate({
            replace: true,
            search: (prev: ListCatalogSearchInput) => ({
              ...prev,
              enrolledOnly: next || undefined,
              offset: 0,
            }),
          })
        }
        onRefresh={query.refetch}
        onSearchChange={setSearchInput}
        onViewChange={(view: CatalogViewMode) =>
          navigate({
            search: (prev: ListCatalogSearchInput) => ({ ...prev, view }),
          })
        }
        search={searchInput}
        view={search.view}
      />

      <CatalogFilters table={table} />

      {search.view === "cards" ? (
        <CatalogCardGrid
          courses={query.data.rows}
          onPageChange={(nextPageIndex) =>
            navigate({
              search: (prev: ListCatalogSearchInput) => ({
                ...prev,
                offset: nextPageIndex * pageSize,
              }),
            })
          }
          onPageSizeChange={(nextPageSize) =>
            navigate({
              search: (prev: ListCatalogSearchInput) => ({
                ...prev,
                limit: nextPageSize,
                offset: 0,
              }),
            })
          }
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalCount={query.data.totalCount}
        />
      ) : (
        <DataTable<CatalogRow>
          emptyMessage="No published courses match your filters."
          table={table}
        />
      )}
    </div>
  );
}
