import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  getCoreRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  AUDIT_LOG_COLUMNS,
  type AuditLogRow,
} from "@/components/dashboard/admin/analytics/audit-log-columns";
import { AuditLogFilters } from "@/components/dashboard/admin/analytics/audit-log-filters";
import {
  listAuditLogSchema,
  type AuditActorTypeFilter,
  type ListAuditLogInput,
} from "@/components/dashboard/admin/analytics/audit-log-schema";
import { AuditLogToolbar } from "@/components/dashboard/admin/analytics/audit-log-toolbar";
import { DataTable } from "@/components/dashboard/data-table";
import { useTRPC } from "@/lib/trpc/client";

export const Route = createFileRoute("/dashboard/admin/logs-analytics/")({
  validateSearch: listAuditLogSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(context.trpc.admin.listAuditLog.queryOptions(deps)),
      context.queryClient.ensureQueryData(context.trpc.admin.listAuditEventNames.queryOptions({})),
    ]);
  },
  component: AdminLogsAnalyticsActivityPage,
});

type SortField = ListAuditLogInput["sortBy"];

// Map TanStack Table column IDs → server sortBy field names
const SORT_FIELD_MAP: Record<string, SortField> = {
  createdAt: "createdAt",
  event: "event",
};

function AdminLogsAnalyticsActivityPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();
  const [isSearchPending, startSearchTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(search.search ?? "");
  const query = useQuery(trpc.admin.listAuditLog.queryOptions(search));
  const eventNamesQuery = useQuery(trpc.admin.listAuditEventNames.queryOptions({}));

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
          search: (prev: ListAuditLogInput) => ({ ...prev, search: next, offset: 0 }),
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

  const table = useReactTable<AuditLogRow>({
    data: query.data?.rows ?? [],
    columns: AUDIT_LOG_COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    state: { sorting, pagination },
    manualSorting: true,
    manualPagination: true,
    rowCount: query.data?.totalCount ?? 0,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];

      navigate({
        search: (prev: ListAuditLogInput) => ({
          ...prev,
          sortBy: first ? (SORT_FIELD_MAP[first.id] ?? "createdAt") : "createdAt",
          sortDirection: first ? (first.desc ? "desc" : "asc") : "desc",
          offset: 0,
        }),
      });
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;

      navigate({
        search: (prev: ListAuditLogInput) => ({
          ...prev,
          offset: next.pageIndex * next.pageSize,
          limit: next.pageSize,
        }),
      });
    },
  });

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <AuditLogToolbar
        isFetching={query.isFetching || isSearchPending}
        onRefresh={() => {
          void query.refetch();
          void eventNamesQuery.refetch();
        }}
        onSearchChange={setSearchInput}
        search={searchInput}
      />

      <AuditLogFilters
        actorTypes={search.actorTypes ?? []}
        eventOptions={eventNamesQuery.data ?? []}
        events={search.events ?? []}
        onActorTypesChange={(actorTypes: AuditActorTypeFilter[]) =>
          navigate({
            search: (prev: ListAuditLogInput) => ({
              ...prev,
              actorTypes: actorTypes.length > 0 ? actorTypes : undefined,
              offset: 0,
            }),
          })
        }
        onEventsChange={(events: string[]) =>
          navigate({
            search: (prev: ListAuditLogInput) => ({
              ...prev,
              events: events.length > 0 ? events : undefined,
              offset: 0,
            }),
          })
        }
      />

      <DataTable<AuditLogRow> emptyMessage="No events recorded yet." table={table} />
    </div>
  );
}
