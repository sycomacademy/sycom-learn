import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  getCoreRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { PublicInviteDialog } from "@/components/dashboard/admin/invite-user-dialog";
import { PublicInvitesFilters } from "@/components/dashboard/admin/public-invites-filters";
import {
  PUBLIC_INVITES_COLUMNS,
  type PublicInviteRow,
} from "@/components/dashboard/admin/public-invites-columns";
import {
  listPublicInvitesSchema,
  type ListPublicInvitesInput,
} from "@/components/dashboard/admin/public-invites-schema";
import { PublicInvitesToolbar } from "@/components/dashboard/admin/public-invites-toolbar";
import { DataTable } from "@/components/dashboard/data-table";
import { useTRPC } from "@/lib/trpc/client";

export const Route = createFileRoute("/dashboard/admin/users/public-invites")({
  validateSearch: listPublicInvitesSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.fetchQuery(
      context.trpc.admin.listPlatformInvitations.queryOptions(deps),
    );
  },
  component: AdminUsersPublicInvitesPage,
});

type SortField = ListPublicInvitesInput["sortBy"];

function AdminUsersPublicInvitesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();
  const [inviteOpen, setInviteOpen] = useState(false);

  const query = useQuery(trpc.admin.listPlatformInvitations.queryOptions(search));

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

  const table = useReactTable<PublicInviteRow>({
    data: query.data?.rows ?? [],
    columns: PUBLIC_INVITES_COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    state: { sorting, pagination },
    manualSorting: true,
    manualPagination: true,
    rowCount: query.data?.totalCount ?? 0,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
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
      const next = typeof updater === "function" ? updater(pagination) : updater;

      navigate({
        search: (prev: ListPublicInvitesInput) => ({
          ...prev,
          offset: next.pageIndex * next.pageSize,
          limit: next.pageSize,
        }),
      });
    },
  });

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <PublicInvitesToolbar
        isFetching={query.isFetching}
        onNewInvite={() => setInviteOpen(true)}
        onRefresh={() => query.refetch()}
      />

      <PublicInviteDialog onOpenChange={setInviteOpen} open={inviteOpen} />

      <PublicInvitesFilters
        onStatusesChange={(statuses) =>
          navigate({
            search: (prev: ListPublicInvitesInput) => ({
              ...prev,
              statuses: statuses.length > 0 ? statuses : undefined,
              offset: 0,
            }),
          })
        }
        statuses={search.statuses ?? []}
      />

      <DataTable<PublicInviteRow> emptyMessage="No public invites yet." table={table} />
    </div>
  );
}
