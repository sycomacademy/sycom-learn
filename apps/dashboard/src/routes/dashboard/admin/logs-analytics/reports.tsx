import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  getCoreRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo } from "react";

import { ReportsFilters } from "@/components/dashboard/admin/analytics/reports-filters";
import {
  REPORTS_COLUMNS,
  type ReportRow,
} from "@/components/dashboard/admin/analytics/reports-columns";
import {
  listAdminReportsSchema,
  type ListAdminReportsInput,
} from "@/components/dashboard/admin/analytics/reports-schema";
import { ReportsToolbar } from "@/components/dashboard/admin/analytics/reports-toolbar";
import { DataTable } from "@/components/dashboard/data-table";
import { useTRPC } from "@/lib/trpc/client";

export const Route = createFileRoute("/dashboard/admin/logs-analytics/reports")({
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

  const query = useQuery(trpc.feedback.listReports.queryOptions(search));

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

  const table = useReactTable<ReportRow>({
    data: query.data?.rows ?? [],
    columns: REPORTS_COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    state: { sorting, pagination },
    manualSorting: true,
    manualPagination: true,
    rowCount: query.data?.totalCount ?? 0,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];

      navigate({
        search: (prev: ListAdminReportsInput) => ({
          ...prev,
          sortBy: first ? (first.id as ListAdminReportsInput["sortBy"]) : undefined,
          sortDirection: first ? (first.desc ? "desc" : "asc") : undefined,
          offset: 0,
        }),
      });
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;

      navigate({
        search: (prev: ListAdminReportsInput) => ({
          ...prev,
          offset: next.pageIndex * next.pageSize,
          limit: next.pageSize,
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

      <ReportsToolbar isFetching={query.isFetching} onRefresh={() => query.refetch()} />

      <ReportsFilters
        onStatusesChange={(statuses) =>
          navigate({
            search: (prev: ListAdminReportsInput) => ({
              ...prev,
              statuses: statuses.length > 0 ? statuses : undefined,
              offset: 0,
            }),
          })
        }
        onTypesChange={(types) =>
          navigate({
            search: (prev: ListAdminReportsInput) => ({
              ...prev,
              types: types.length > 0 ? types : undefined,
              offset: 0,
            }),
          })
        }
        statuses={search.statuses ?? []}
        types={search.types ?? []}
      />

      <DataTable<ReportRow> emptyMessage="No reports submitted yet." table={table} />
    </div>
  );
}
