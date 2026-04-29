import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  getCoreRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState, useTransition } from "react";

import { CreateOrganizationDialog } from "@/components/dashboard/admin/create-organization-dialog";
import {
  ORGANIZATION_COLUMNS,
  type OrganizationRow,
} from "@/components/dashboard/admin/organizations-columns";
import {
  listAdminOrganizationsSchema,
  type ListAdminOrganizationsInput,
} from "@/components/dashboard/admin/organizations-schema";
import { OrganizationsToolbar } from "@/components/dashboard/admin/organizations-toolbar";
import { DataTable } from "@/components/dashboard/data-table";
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

type SortField = ListAdminOrganizationsInput["sortBy"];

function OrganizationsAllPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();
  const [isSearchPending, startSearchTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(search.search ?? "");
  const [createOpen, setCreateOpen] = useState(false);

  const query = useQuery(trpc.admin.listOrganizations.queryOptions(search));

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
          search: (prev: ListAdminOrganizationsInput) => ({ ...prev, search: next, offset: 0 }),
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

  const table = useReactTable<OrganizationRow>({
    data: query.data?.rows ?? [],
    columns: ORGANIZATION_COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    state: { sorting, pagination },
    manualSorting: true,
    manualPagination: true,
    rowCount: query.data?.totalCount ?? 0,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];

      navigate({
        search: (prev: ListAdminOrganizationsInput) => ({
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
        isFetching={query.isFetching || isSearchPending}
        onNewOrganization={() => setCreateOpen(true)}
        onRefresh={() => query.refetch()}
        onSearchChange={setSearchInput}
        search={searchInput}
      />

      <CreateOrganizationDialog onOpenChange={setCreateOpen} open={createOpen} />

      <DataTable<OrganizationRow> emptyMessage="No organizations found." table={table} />
    </div>
  );
}
