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

import { ORGANIZATION_COLUMNS } from "@/components/dashboard/admin/orgs/organizations-columns";
import {
  listAdminOrganizationsSchema,
  type ListAdminOrganizationsInput,
  type OrganizationRow,
  type OrganizationSortField,
} from "@/components/dashboard/admin/orgs/organizations-schema";
import { OrganizationsToolbar } from "@/components/dashboard/admin/orgs/organizations-toolbar";
import { DataTable } from "@/components/dashboard/data-table";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useTRPC } from "@/lib/trpc/client";

export const Route = createFileRoute("/dashboard/admin/organizations/")({
  validateSearch: listAdminOrganizationsSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.admin.listOrganizations.queryOptions(deps),
    );
  },
  component: OrganizationsAllPage,
});
function OrganizationsAllPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();
  const { searchInput, setSearchInput } = useDebouncedSearch({
    committedValue: search.search,
    onDebouncedCommit: (next) =>
      navigate({
        replace: true,
        search: (prev: ListAdminOrganizationsInput) => ({ ...prev, search: next, offset: 0 }),
      }),
  });

  const query = useSuspenseQuery(trpc.admin.listOrganizations.queryOptions(search));
  const isFetching = useIsFetching({ queryKey: trpc.admin.listOrganizations.queryKey() }) > 0;
  const tableState = useMemo(
    () => ({
      sorting: [{ id: search.sortBy, desc: search.sortDirection === "desc" }] as SortingState,
      pagination: {
        pageIndex: Math.floor(search.offset / search.limit),
        pageSize: search.limit,
      } as PaginationState,
      columnFilters: [] as ColumnFiltersState,
    }),
    [search],
  );

  const table = useReactTable<OrganizationRow>({
    data: query.data.rows,
    columns: ORGANIZATION_COLUMNS,
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
        search: (prev: ListAdminOrganizationsInput) => ({
          ...prev,
          sortBy: first ? (first.id as OrganizationSortField) : undefined,
          sortDirection: first ? (first.desc ? "desc" : "asc") : undefined,
          offset: 0,
        }),
      });
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState.pagination) : updater;

      navigate({
        search: (prev: ListAdminOrganizationsInput) => ({
          ...prev,
          offset: next.pageIndex * next.pageSize,
          limit: next.pageSize,
        }),
      });
    },
  });

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <OrganizationsToolbar
        isFetching={isFetching}
        onRefresh={query.refetch}
        onSearchChange={setSearchInput}
        search={searchInput}
      />

      <DataTable<OrganizationRow> emptyMessage="No organizations found." table={table} />
    </div>
  );
}
