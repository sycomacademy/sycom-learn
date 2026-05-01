import { useSuspenseQuery, useIsFetching } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo } from "react";

import { PublicInvitesFilters } from "@/components/dashboard/admin/users/public-invites-filters";
import {
  PUBLIC_INVITES_COLUMNS,
  type PublicInviteRow,
} from "@/components/dashboard/admin/users/public-invites-columns";
import {
  getPublicInvitesQueryInput,
  getPublicInvitesSentRangeFilter,
  listPublicInvitesSchema,
  type ListPublicInvitesInput,
  type PlatformInvitationFilterStatus,
  type PublicInvitesSentRange,
  type SortField,
} from "@/components/dashboard/admin/users/public-invites-schema";
import { PublicInvitesToolbar } from "@/components/dashboard/admin/users/public-invites-toolbar";
import { DataTable } from "@/components/dashboard/data-table";
import { useTRPC } from "@/lib/trpc/client";
import { toEndOfDayIso, toStartOfDayIso } from "@sycom/ui/lib/date";

export const Route = createFileRoute("/dashboard/admin/users/public-invites")({
  validateSearch: listPublicInvitesSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.admin.listPlatformInvitations.queryOptions(getPublicInvitesQueryInput(deps)),
    );
  },
  component: AdminUsersPublicInvitesPage,
});

function AdminUsersPublicInvitesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();

  const queryInput = useMemo(() => getPublicInvitesQueryInput(search), [search]);
  const query = useSuspenseQuery(trpc.admin.listPlatformInvitations.queryOptions(queryInput));
  const isFetching = useIsFetching({ queryKey: trpc.admin.listPlatformInvitations.queryKey() }) > 0;
  const tableState = useMemo(
    () => ({
      sorting: [{ id: search.sortBy, desc: search.sortDirection === "desc" }] as SortingState,
      pagination: {
        pageIndex: Math.floor(search.offset / search.limit),
        pageSize: search.limit,
      } as PaginationState,
      columnFilters: [
        ...(search.statuses?.length ? [{ id: "status", value: search.statuses }] : []),
        ...(getPublicInvitesSentRangeFilter(search)
          ? [{ id: "createdAt", value: getPublicInvitesSentRangeFilter(search) }]
          : []),
      ] as ColumnFiltersState,
    }),
    [search],
  );

  const table = useReactTable<PublicInviteRow>({
    data: query.data.rows,
    columns: PUBLIC_INVITES_COLUMNS,
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
        search: (prev: ListPublicInvitesInput) => ({
          ...prev,
          sortBy: first ? (first.id as SortField) : undefined,
          sortDirection: first ? (first.desc ? "desc" : "asc") : undefined,
          offset: 0,
        }),
      });
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState.pagination) : updater;
      navigate({
        search: (prev: ListPublicInvitesInput) => ({
          ...prev,
          offset: next.pageIndex * next.pageSize,
          limit: next.pageSize,
        }),
      });
    },
    onColumnFiltersChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState.columnFilters) : updater;
      const statuses = next.find((filter) => filter.id === "status")?.value as
        | PlatformInvitationFilterStatus[]
        | undefined;
      const sentRange = next.find((filter) => filter.id === "createdAt")?.value as
        | PublicInvitesSentRange
        | undefined;

      navigate({
        search: (prev: ListPublicInvitesInput) => ({
          ...prev,
          statuses: statuses?.length ? statuses : undefined,
          sentFrom: sentRange?.from ? toStartOfDayIso(new Date(sentRange.from)) : undefined,
          sentTo: sentRange?.to ? toEndOfDayIso(new Date(sentRange.to)) : undefined,
          offset: 0,
        }),
      });
    },
  });

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <PublicInvitesToolbar isFetching={isFetching} onRefresh={query.refetch} />

      <PublicInvitesFilters table={table} />

      <DataTable<PublicInviteRow> emptyMessage="No public invites yet." table={table} />
    </div>
  );
}
