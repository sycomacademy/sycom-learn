import { type OrganizationRole } from "@sycom/db/schema/auth";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  getCoreRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo } from "react";

import {
  ORG_INVITES_COLUMNS,
  type OrgInviteRow,
} from "@/components/dashboard/admin/orgs/org-invites-columns";
import { OrgInvitesFilters } from "@/components/dashboard/admin/orgs/org-invites-filters";
import {
  listOrgInvitesSchema,
  type ListOrgInvitesInput,
  type OrganizationInvitationFilterStatus,
} from "@/components/dashboard/admin/orgs/org-invites-schema";
import { OrgInvitesToolbar } from "@/components/dashboard/admin/orgs/org-invites-toolbar";
import { DataTable } from "@/components/dashboard/data-table";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useTRPC } from "@/lib/trpc/client";

export const Route = createFileRoute("/dashboard/admin/organizations/invites")({
  validateSearch: listOrgInvitesSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.admin.listOrganizationInvitations.queryOptions(deps),
    );
  },
  component: AdminOrganizationsInvitesPage,
});

type SortField = ListOrgInvitesInput["sortBy"];

function AdminOrganizationsInvitesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();
  const { searchInput, setSearchInput, isSearchPending } = useDebouncedSearch({
    committedValue: search.search,
    onDebouncedCommit: (next) =>
      navigate({
        replace: true,
        search: (prev: ListOrgInvitesInput) => ({ ...prev, search: next, offset: 0 }),
      }),
  });

  const query = useQuery(trpc.admin.listOrganizationInvitations.queryOptions(search));

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

  const table = useReactTable<OrgInviteRow>({
    data: query.data?.rows ?? [],
    columns: ORG_INVITES_COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    state: { sorting, pagination },
    manualSorting: true,
    manualPagination: true,
    rowCount: query.data?.totalCount ?? 0,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];

      navigate({
        search: (prev: ListOrgInvitesInput) => ({
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
        search: (prev: ListOrgInvitesInput) => ({
          ...prev,
          offset: next.pageIndex * next.pageSize,
          limit: next.pageSize,
        }),
      });
    },
  });

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <OrgInvitesToolbar
        isFetching={query.isFetching || isSearchPending}
        onRefresh={() => query.refetch()}
        onSearchChange={setSearchInput}
        search={searchInput}
      />

      <OrgInvitesFilters
        onRolesChange={(roles: OrganizationRole[]) =>
          navigate({
            search: (prev: ListOrgInvitesInput) => ({
              ...prev,
              roles: roles.length > 0 ? roles : undefined,
              offset: 0,
            }),
          })
        }
        onStatusesChange={(statuses: OrganizationInvitationFilterStatus[]) =>
          navigate({
            search: (prev: ListOrgInvitesInput) => ({
              ...prev,
              statuses: statuses.length > 0 ? statuses : undefined,
              offset: 0,
            }),
          })
        }
        roles={search.roles ?? []}
        statuses={search.statuses ?? []}
      />

      <DataTable<OrgInviteRow> emptyMessage="No organization invites yet." table={table} />
    </div>
  );
}
