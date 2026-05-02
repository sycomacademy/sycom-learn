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

import { FEEDBACK_COLUMNS } from "@/components/dashboard/admin/analytics/feedback-columns";
import {
  type FeedbackRow,
  type FeedbackSortField,
  listAdminFeedbackSchema,
  type ListAdminFeedbackInput,
} from "@/components/dashboard/admin/analytics/feedback-schema";
import { FeedbackToolbar } from "@/components/dashboard/admin/analytics/feedback-toolbar";
import { DataTable } from "@/components/dashboard/data-table";
import { useTRPC } from "@/lib/trpc/client";

export const Route = createFileRoute("/dashboard/admin/logs-analytics/feedback")({
  validateSearch: listAdminFeedbackSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.feedback.listFeedback.queryOptions(deps),
    );
  },
  component: AdminLogsAnalyticsFeedbackPage,
});

function AdminLogsAnalyticsFeedbackPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();

  const query = useSuspenseQuery(trpc.feedback.listFeedback.queryOptions(search));
  const isFetching = useIsFetching({ queryKey: trpc.feedback.listFeedback.queryKey() }) > 0;
  const tableState = useMemo(
    () => ({
      sorting: [{ id: search.sortBy, desc: search.sortDirection === "desc" }] as SortingState,
      pagination: {
        pageIndex: Math.floor(search.offset / search.limit),
        pageSize: search.limit,
      } as PaginationState,
      columnFilters: [] as ColumnFiltersState,
    }),
    [search],
  );

  const table = useReactTable<FeedbackRow>({
    data: query.data.rows,
    columns: FEEDBACK_COLUMNS,
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
        search: (prev: ListAdminFeedbackInput) => ({
          ...prev,
          sortBy: first ? (first.id as FeedbackSortField) : undefined,
          sortDirection: first ? (first.desc ? "desc" : "asc") : undefined,
          offset: 0,
        }),
      });
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState.pagination) : updater;

      navigate({
        search: (prev: ListAdminFeedbackInput) => ({
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
        <h1 className="text-sm font-medium">Feedback</h1>
        <p className="text-sm text-muted-foreground">
          Review incoming product feedback from signed-in users and guests.
        </p>
      </div>

      <FeedbackToolbar isFetching={isFetching} onRefresh={query.refetch} />

      <DataTable<FeedbackRow> emptyMessage="No feedback submitted yet." table={table} />
    </div>
  );
}
