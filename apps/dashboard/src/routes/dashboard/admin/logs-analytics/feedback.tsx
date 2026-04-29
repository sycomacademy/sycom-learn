import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  getCoreRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo } from "react";

import { FEEDBACK_COLUMNS, type FeedbackRow } from "@/components/dashboard/admin/feedback-columns";
import {
  listAdminFeedbackSchema,
  type ListAdminFeedbackInput,
} from "@/components/dashboard/admin/feedback-schema";
import { FeedbackToolbar } from "@/components/dashboard/admin/feedback-toolbar";
import { DataTable } from "@/components/dashboard/data-table";
import { useTRPC } from "@/lib/trpc/client";

export const Route = createFileRoute("/dashboard/admin/logs-analytics/feedback")({
  validateSearch: listAdminFeedbackSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.fetchQuery(context.trpc.admin.listFeedback.queryOptions(deps));
  },
  component: AdminLogsAnalyticsFeedbackPage,
});

function AdminLogsAnalyticsFeedbackPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();

  const query = useQuery(trpc.admin.listFeedback.queryOptions(search));

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

  const table = useReactTable<FeedbackRow>({
    data: query.data?.rows ?? [],
    columns: FEEDBACK_COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    state: { sorting, pagination },
    manualSorting: true,
    manualPagination: true,
    rowCount: query.data?.totalCount ?? 0,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];

      navigate({
        search: (prev: ListAdminFeedbackInput) => ({
          ...prev,
          sortBy: first ? (first.id as ListAdminFeedbackInput["sortBy"]) : undefined,
          sortDirection: first ? (first.desc ? "desc" : "asc") : undefined,
          offset: 0,
        }),
      });
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;

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

      <FeedbackToolbar isFetching={query.isFetching} onRefresh={() => query.refetch()} />

      <DataTable<FeedbackRow> emptyMessage="No feedback submitted yet." table={table} />
    </div>
  );
}
