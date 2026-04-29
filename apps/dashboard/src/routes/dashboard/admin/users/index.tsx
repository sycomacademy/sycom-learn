import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  getCoreRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState, useTransition } from "react";

import { USER_COLUMNS, type UserRow } from "@/components/dashboard/admin/users-columns";
import { UsersFilters } from "@/components/dashboard/admin/users-filters";
import {
  listAdminUsersSchema,
  type ListAdminUsersInput,
} from "@/components/dashboard/admin/users-schema";
import { UsersToolbar } from "@/components/dashboard/admin/users-toolbar";
import { DataTable } from "@/components/dashboard/data-table";
import { useTRPC } from "@/lib/trpc/client";

export const Route = createFileRoute("/dashboard/admin/users/")({
  validateSearch: listAdminUsersSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.fetchQuery(context.trpc.admin.listUsers.queryOptions(deps));
  },
  component: UsersAllPage,
});

type SortField = ListAdminUsersInput["sortBy"];

function UsersAllPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();
  const [isSearchPending, startSearchTransition] = useTransition();

  const query = useQuery(trpc.admin.listUsers.queryOptions(search));

  const [searchInput, setSearchInput] = useState(search.search ?? "");
  useEffect(() => {
    setSearchInput(search.search ?? "");
  }, [search.search]);
  useEffect(() => {
    const next = searchInput.trim() || undefined;
    if ((search.search ?? undefined) === next) return;
    const handle = setTimeout(() => {
      startSearchTransition(() => {
        navigate({
          replace: true,
          search: (prev: ListAdminUsersInput) => ({ ...prev, search: next, offset: 0 }),
        });
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput, navigate, search.search, startSearchTransition]);

  const sorting = useMemo<SortingState>(
    () => [{ id: search.sortBy, desc: search.sortDirection === "desc" }],
    [search.sortBy, search.sortDirection],
  );

  const pagination = useMemo<PaginationState>(
    () => ({
      pageIndex: Math.floor(search.offset / search.limit),
      pageSize: search.limit,
    }),
    [search.offset, search.limit],
  );

  const table = useReactTable<UserRow>({
    data: query.data?.rows ?? [],
    columns: USER_COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    state: { sorting, pagination },
    manualSorting: true,
    manualPagination: true,
    rowCount: query.data?.totalCount ?? 0,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];
      navigate({
        search: (prev: ListAdminUsersInput) => ({
          ...prev,
          sortBy: first ? (first.id as SortField) : undefined,
          sortDirection: first ? (first.desc ? "desc" : "asc") : undefined,
          offset: 0,
        }),
      });
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;
      navigate({
        search: (prev: ListAdminUsersInput) => ({
          ...prev,
          offset: next.pageIndex * next.pageSize,
          limit: next.pageSize,
        }),
      });
    },
  });

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <UsersToolbar
        isFetching={query.isFetching || isSearchPending}
        onRefresh={() => query.refetch()}
        onSearchChange={setSearchInput}
        search={searchInput}
      />

      <UsersFilters
        onRolesChange={(roles) =>
          navigate({
            search: (prev: ListAdminUsersInput) => ({
              ...prev,
              roles: roles.length > 0 ? roles : undefined,
              offset: 0,
            }),
          })
        }
        onStatusesChange={(statuses) =>
          navigate({
            search: (prev: ListAdminUsersInput) => ({
              ...prev,
              statuses: statuses.length > 0 ? statuses : undefined,
              offset: 0,
            }),
          })
        }
        roles={search.roles ?? []}
        statuses={search.statuses ?? []}
      />

      <DataTable<UserRow> table={table} />
    </div>
  );
}
