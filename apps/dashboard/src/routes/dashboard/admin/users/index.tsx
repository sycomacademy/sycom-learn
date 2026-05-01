import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo } from "react";

import { USER_COLUMNS } from "@/components/dashboard/admin/users/users-columns";
import type { UserRow } from "@/components/dashboard/admin/users/users-schema";
import { UsersFilters } from "@/components/dashboard/admin/users/users-filters";
import {
  listAdminUsersSchema,
  type AdminUserStatus,
  type ListAdminUsersInput,
  type SortBy,
} from "@/components/dashboard/admin/users/users-schema";
import { UsersToolbar } from "@/components/dashboard/admin/users/users-toolbar";
import { DataTable } from "@/components/dashboard/data-table";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useTRPC } from "@/lib/trpc/client";
import type { UserRole } from "@sycom/db/schema/auth";

export const Route = createFileRoute("/dashboard/admin/users/")({
  validateSearch: listAdminUsersSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(context.trpc.admin.listUsers.queryOptions(deps));
  },
  component: UsersAllPage,
});

function UsersAllPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();

  const { searchInput, setSearchInput, isSearchPending } = useDebouncedSearch({
    committedValue: search.search,
    onDebouncedCommit: (next) =>
      navigate({
        replace: true,
        search: (prev: ListAdminUsersInput) => ({ ...prev, search: next, offset: 0 }),
      }),
  });

  const query = useSuspenseQuery(trpc.admin.listUsers.queryOptions(search));

  const tableState = useMemo(
    () => ({
      sorting: [{ id: search.sortBy, desc: search.sortDirection === "desc" }] as SortingState,
      pagination: {
        pageIndex: Math.floor(search.offset / search.limit),
        pageSize: search.limit,
      } as PaginationState,
      columnFilters: [
        ...(search.roles?.length ? [{ id: "role", value: search.roles }] : []),
        ...(search.statuses?.length ? [{ id: "status", value: search.statuses }] : []),
      ] as ColumnFiltersState,
    }),
    [
      search.sortBy,
      search.sortDirection,
      search.offset,
      search.limit,
      search.roles,
      search.statuses,
    ],
  );

  const table = useReactTable<UserRow>({
    data: query.data.rows,
    columns: USER_COLUMNS,
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
        search: (prev: ListAdminUsersInput) => ({
          ...prev,
          sortBy: first ? (first.id as SortBy) : undefined,
          sortDirection: first ? (first.desc ? "desc" : "asc") : undefined,
          offset: 0,
        }),
      });
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState.pagination) : updater;
      navigate({
        search: (prev: ListAdminUsersInput) => ({
          ...prev,
          offset: next.pageIndex * next.pageSize,
          limit: next.pageSize,
        }),
      });
    },
    onColumnFiltersChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState.columnFilters) : updater;
      const roles = next.find((f) => f.id === "role")?.value as UserRole[] | undefined;
      const statuses = next.find((f) => f.id === "status")?.value as AdminUserStatus[] | undefined;
      navigate({
        search: (prev: ListAdminUsersInput) => ({
          ...prev,
          roles: roles?.length ? roles : undefined,
          statuses: statuses?.length ? statuses : undefined,
          offset: 0,
        }),
      });
    },
  });

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <UsersToolbar
        isFetching={query.isFetching || isSearchPending}
        onRefresh={query.refetch}
        onSearchChange={setSearchInput}
        search={searchInput}
      />
      <UsersFilters table={table} />
      <DataTable<UserRow> table={table} />
    </div>
  );
}
