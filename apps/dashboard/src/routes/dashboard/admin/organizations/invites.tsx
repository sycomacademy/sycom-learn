import { type OrganizationRole } from "@sycom/db/schema/auth";
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

import { ORG_INVITES_COLUMNS } from "@/components/dashboard/admin/orgs/org-invites-columns";
import { OrgInvitesFilters } from "@/components/dashboard/admin/orgs/org-invites-filters";
import {
  getOrgInvitesQueryInput,
  getOrgInvitesSentRangeFilter,
  listOrgInvitesSchema,
  type ListOrgInvitesInput,
  type OrgInviteRow,
  type OrgInvitesSentRange,
  type OrgInvitesSortField,
  type OrganizationInvitationFilterStatus,
} from "@/components/dashboard/admin/orgs/org-invites-schema";
import { OrgInvitesToolbar } from "@/components/dashboard/admin/orgs/org-invites-toolbar";
import { DataTable } from "@/components/dashboard/data-table";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useTRPC } from "@/lib/trpc/client";
import { toEndOfDayIso, toStartOfDayIso } from "@sycom/ui/lib/date";

export const Route = createFileRoute("/dashboard/admin/organizations/invites")({
  validateSearch: listOrgInvitesSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.admin.listOrganizationInvitations.queryOptions(getOrgInvitesQueryInput(deps)),
    );
  },
  component: AdminOrganizationsInvitesPage,
});

function AdminOrganizationsInvitesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();
  const { searchInput, setSearchInput } = useDebouncedSearch({
    committedValue: search.search,
    onDebouncedCommit: (next) =>
      navigate({
        replace: true,
        search: (prev: ListOrgInvitesInput) => ({ ...prev, search: next, offset: 0 }),
      }),
  });

  const queryInput = useMemo(() => getOrgInvitesQueryInput(search), [search]);
  const query = useSuspenseQuery(trpc.admin.listOrganizationInvitations.queryOptions(queryInput));
  const isFetching =
    useIsFetching({ queryKey: trpc.admin.listOrganizationInvitations.queryKey() }) > 0;
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
        ...(getOrgInvitesSentRangeFilter(search)
          ? [{ id: "createdAt", value: getOrgInvitesSentRangeFilter(search) }]
          : []),
      ] as ColumnFiltersState,
    }),
    [search],
  );

  const table = useReactTable<OrgInviteRow>({
    data: query.data.rows,
    columns: ORG_INVITES_COLUMNS,
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
        search: (prev: ListOrgInvitesInput) => ({
          ...prev,
          sortBy: first ? (first.id as OrgInvitesSortField) : undefined,
          sortDirection: first ? (first.desc ? "desc" : "asc") : undefined,
          offset: 0,
        }),
      });
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState.pagination) : updater;

      navigate({
        search: (prev: ListOrgInvitesInput) => ({
          ...prev,
          offset: next.pageIndex * next.pageSize,
          limit: next.pageSize,
        }),
      });
    },
    onColumnFiltersChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState.columnFilters) : updater;
      const roles = next.find((filter) => filter.id === "role")?.value as
        | OrganizationRole[]
        | undefined;
      const statuses = next.find((filter) => filter.id === "status")?.value as
        | OrganizationInvitationFilterStatus[]
        | undefined;
      const sentRange = next.find((filter) => filter.id === "createdAt")?.value as
        | OrgInvitesSentRange
        | undefined;

      navigate({
        search: (prev: ListOrgInvitesInput) => ({
          ...prev,
          roles: roles?.length ? roles : undefined,
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
      <OrgInvitesToolbar
        isFetching={isFetching}
        onRefresh={query.refetch}
        onSearchChange={setSearchInput}
        search={searchInput}
      />

      <OrgInvitesFilters table={table} />

      <DataTable<OrgInviteRow> emptyMessage="No organization invites yet." table={table} />
    </div>
  );
}
