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

import { AUDIT_LOG_COLUMNS } from "@/components/dashboard/admin/analytics/audit-log-columns";
import { AuditLogFilters } from "@/components/dashboard/admin/analytics/audit-log-filters";
import {
  getAuditLogDateRangeFilter,
  getAuditLogQueryInput,
  listAuditLogSchema,
  type AuditActorTypeFilter,
  type AuditLogDateRange,
  type AuditLogRow,
  type AuditLogSortField,
  type ListAuditLogInput,
} from "@/components/dashboard/admin/analytics/audit-log-schema";
import { AuditLogToolbar } from "@/components/dashboard/admin/analytics/audit-log-toolbar";
import { DataTable } from "@/components/dashboard/data-table";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useTRPC } from "@/lib/trpc/client";
import { toEndOfDayIso, toStartOfDayIso } from "@sycom/ui/lib/date";

const SORT_FIELD_MAP: Record<string, AuditLogSortField> = {
  createdAt: "createdAt",
  event: "event",
};

export const Route = createFileRoute("/dashboard/admin/logs-analytics/")({
  validateSearch: listAuditLogSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        context.trpc.admin.listAuditLog.queryOptions(getAuditLogQueryInput(deps)),
      ),
      context.queryClient.ensureQueryData(context.trpc.admin.listAuditEventNames.queryOptions({})),
    ]);
  },
  component: AdminLogsAnalyticsActivityPage,
});

function AdminLogsAnalyticsActivityPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();
  const { searchInput, setSearchInput } = useDebouncedSearch({
    committedValue: search.search,
    onDebouncedCommit: (next) =>
      navigate({
        replace: true,
        search: (prev: ListAuditLogInput) => ({ ...prev, search: next, offset: 0 }),
      }),
  });

  const queryInput = useMemo(() => getAuditLogQueryInput(search), [search]);
  const query = useSuspenseQuery(trpc.admin.listAuditLog.queryOptions(queryInput));
  const eventNamesQuery = useSuspenseQuery(trpc.admin.listAuditEventNames.queryOptions({}));
  const isFetching = useIsFetching({ queryKey: trpc.admin.listAuditLog.queryKey() }) > 0;
  const dateRangeFilter = getAuditLogDateRangeFilter(search);
  const tableState = useMemo(
    () => ({
      sorting: [{ id: search.sortBy, desc: search.sortDirection === "desc" }] as SortingState,
      pagination: {
        pageIndex: Math.floor(search.offset / search.limit),
        pageSize: search.limit,
      } as PaginationState,
      columnFilters: [
        ...(search.actorTypes?.length ? [{ id: "actorType", value: search.actorTypes }] : []),
        ...(search.events?.length ? [{ id: "event", value: search.events }] : []),
        ...(dateRangeFilter ? [{ id: "createdAt", value: dateRangeFilter }] : []),
      ] as ColumnFiltersState,
    }),
    [dateRangeFilter, search],
  );

  const table = useReactTable<AuditLogRow>({
    data: query.data.rows,
    columns: AUDIT_LOG_COLUMNS,
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
        search: (prev: ListAuditLogInput) => ({
          ...prev,
          sortBy: first ? (SORT_FIELD_MAP[first.id] ?? "createdAt") : "createdAt",
          sortDirection: first ? (first.desc ? "desc" : "asc") : "desc",
          offset: 0,
        }),
      });
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState.pagination) : updater;

      navigate({
        search: (prev: ListAuditLogInput) => ({
          ...prev,
          offset: next.pageIndex * next.pageSize,
          limit: next.pageSize,
        }),
      });
    },
    onColumnFiltersChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState.columnFilters) : updater;
      const actorTypes = next.find((filter) => filter.id === "actorType")?.value as
        | AuditActorTypeFilter[]
        | undefined;
      const events = next.find((filter) => filter.id === "event")?.value as string[] | undefined;
      const dateRange = next.find((filter) => filter.id === "createdAt")?.value as
        | AuditLogDateRange
        | undefined;

      navigate({
        search: (prev: ListAuditLogInput) => ({
          ...prev,
          actorTypes: actorTypes?.length ? actorTypes : undefined,
          events: events?.length ? events : undefined,
          dateFrom: dateRange?.from ? toStartOfDayIso(new Date(dateRange.from)) : undefined,
          dateTo: dateRange?.to ? toEndOfDayIso(new Date(dateRange.to)) : undefined,
          offset: 0,
        }),
      });
    },
  });

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <AuditLogToolbar
        isFetching={isFetching}
        onRefresh={() => {
          void query.refetch();
          void eventNamesQuery.refetch();
        }}
        onSearchChange={setSearchInput}
        search={searchInput}
      />

      <AuditLogFilters eventOptions={eventNamesQuery.data ?? []} table={table} />

      <DataTable<AuditLogRow> emptyMessage="No events recorded yet." table={table} />
    </div>
  );
}
