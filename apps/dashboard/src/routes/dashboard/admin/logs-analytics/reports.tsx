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

import { ReportsFilters } from "@/components/dashboard/admin/analytics/reports-filters";
import { REPORTS_COLUMNS } from "@/components/dashboard/admin/analytics/reports-columns";
import {
  listAdminReportsSchema,
  type FeedbackReportStatus,
  type FeedbackReportType,
  type ListAdminReportsInput,
  type ReportsSortField,
  type ReportRow,
} from "@/components/dashboard/admin/analytics/reports-schema";
import { ReportsToolbar } from "@/components/dashboard/admin/analytics/reports-toolbar";
import { DataTable } from "@/components/dashboard/data-table";
import { useTRPC } from "@/lib/trpc/client";

export const Route = createFileRoute("/dashboard/admin/logs-analytics/reports")({
  pendingMs: Number.POSITIVE_INFINITY,
  validateSearch: listAdminReportsSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(context.trpc.feedback.listReports.queryOptions(deps));
  },
  component: AdminLogsAnalyticsReportsPage,
});

function AdminLogsAnalyticsReportsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();

  const query = useSuspenseQuery(trpc.feedback.listReports.queryOptions(search));
  const isFetching = useIsFetching({ queryKey: trpc.feedback.listReports.queryKey() }) > 0;
  const tableState = useMemo(
    () => ({
      sorting: [{ id: search.sortBy, desc: search.sortDirection === "desc" }] as SortingState,
      pagination: {
        pageIndex: Math.floor(search.offset / search.limit),
        pageSize: search.limit,
      } as PaginationState,
      columnFilters: [
        ...(search.statuses?.length ? [{ id: "status", value: search.statuses }] : []),
        ...(search.types?.length ? [{ id: "type", value: search.types }] : []),
      ] as ColumnFiltersState,
    }),
    [search],
  );

  const table = useReactTable<ReportRow>({
    data: query.data.rows,
    columns: REPORTS_COLUMNS,
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
        search: (prev: ListAdminReportsInput) => ({
          ...prev,
          sortBy: first ? (first.id as ReportsSortField) : undefined,
          sortDirection: first ? (first.desc ? "desc" : "asc") : undefined,
          offset: 0,
        }),
      });
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState.pagination) : updater;

      navigate({
        search: (prev: ListAdminReportsInput) => ({
          ...prev,
          offset: next.pageIndex * next.pageSize,
          limit: next.pageSize,
        }),
      });
    },
    onColumnFiltersChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState.columnFilters) : updater;
      const statuses = next.find((filter) => filter.id === "status")?.value as
        | FeedbackReportStatus[]
        | undefined;
      const types = next.find((filter) => filter.id === "type")?.value as
        | FeedbackReportType[]
        | undefined;

      navigate({
        search: (prev: ListAdminReportsInput) => ({
          ...prev,
          statuses: statuses?.length ? statuses : undefined,
          types: types?.length ? types : undefined,
          offset: 0,
        }),
      });
    },
  });

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <div>
        <h1 className="text-sm font-medium">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Track bug reports, feature requests, complaints, and other support escalations.
        </p>
      </div>

      <ReportsToolbar isFetching={isFetching} onRefresh={query.refetch} />

      <ReportsFilters table={table} />

      <DataTable<ReportRow> emptyMessage="No reports submitted yet." table={table} />
    </div>
  );
}
