import { useIsFetching, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  getCoreRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo } from "react";

import { ORG_INVITATION_COLUMNS } from "@/components/dashboard/org/users/org-invitations-columns";
import {
  listOrgInvitationsSchema,
  type ListOrgInvitationsInput,
  type OrgInvitationRow,
  type OrgInvitationsSortBy,
} from "@/components/dashboard/org/users/org-invitations-schema";
import { OrgInvitationsToolbar } from "@/components/dashboard/org/users/org-invitations-toolbar";
import { DataTable } from "@/components/dashboard/data-table";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useTRPC } from "@/lib/trpc/client";

export const Route = createFileRoute("/dashboard/org/users/invites")({
  head: () => ({
    meta: [{ title: "Invites | Users | Organization | Sycom LMS" }],
  }),
  validateSearch: listOrgInvitationsSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.organization.listInvitations.queryOptions(deps),
    );
  },
  component: OrgUsersInvitesPage,
});

function OrgUsersInvitesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();

  const { searchInput, setSearchInput } = useDebouncedSearch({
    committedValue: search.search,
    delayMs: 600,
    onDebouncedCommit: (next) =>
      navigate({
        replace: true,
        search: (prev: ListOrgInvitationsInput) => ({ ...prev, search: next, offset: 0 }),
      }),
  });

  const query = useSuspenseQuery(trpc.organization.listInvitations.queryOptions(search));
  const isFetching = useIsFetching({ queryKey: trpc.organization.listInvitations.queryKey() }) > 0;

  const tableState = useMemo(
    () => ({
      sorting: [{ id: search.sortBy, desc: search.sortDirection === "desc" }] as SortingState,
      pagination: {
        pageIndex: Math.floor(search.offset / search.limit),
        pageSize: search.limit,
      } as PaginationState,
    }),
    [search],
  );

  const table = useReactTable<OrgInvitationRow>({
    data: query.data.rows,
    columns: ORG_INVITATION_COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    state: tableState,
    manualSorting: true,
    manualPagination: true,
    rowCount: query.data.totalCount,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState.sorting) : updater;
      const first = next[0];
      navigate({
        search: (prev: ListOrgInvitationsInput) => ({
          ...prev,
          sortBy: first ? (first.id as OrgInvitationsSortBy) : undefined,
          sortDirection: first ? (first.desc ? "desc" : "asc") : undefined,
          offset: 0,
        }),
      });
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState.pagination) : updater;
      navigate({
        search: (prev: ListOrgInvitationsInput) => ({
          ...prev,
          offset: next.pageIndex * next.pageSize,
          limit: next.pageSize,
        }),
      });
    },
  });

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <OrgInvitationsToolbar
        isFetching={isFetching}
        onRefresh={query.refetch}
        onSearchChange={setSearchInput}
        search={searchInput}
      />
      <DataTable<OrgInvitationRow> table={table} />
    </div>
  );
}
