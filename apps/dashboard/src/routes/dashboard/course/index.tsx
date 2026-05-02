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

import { CoursesCardGrid } from "@/components/dashboard/course/courses-card-grid";
import { COURSE_COLUMNS } from "@/components/dashboard/course/courses-columns";
import { CoursesFilters } from "@/components/dashboard/course/courses-filters";
import {
  getCoursesQueryInput,
  listAdminCoursesSchema,
  type CourseRow,
  type CourseSortField,
  type CourseStatus,
  type CourseViewMode,
  type ListAdminCoursesInput,
} from "@/components/dashboard/course/courses-schema";
import { CoursesToolbar } from "@/components/dashboard/course/courses-toolbar";
import { DataTable } from "@/components/dashboard/data-table";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useTRPC } from "@/lib/trpc/client";

export const Route = createFileRoute("/dashboard/course/")({
  validateSearch: listAdminCoursesSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.course.list.queryOptions(getCoursesQueryInput(deps)),
    );
  },
  component: CoursesPage,
});

function CoursesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();
  const { searchInput, setSearchInput } = useDebouncedSearch({
    committedValue: search.search,
    delayMs: 600,
    onDebouncedCommit: (next) =>
      navigate({
        replace: true,
        search: (prev: ListAdminCoursesInput) => ({ ...prev, search: next, offset: 0 }),
      }),
  });

  const queryInput = useMemo(() => getCoursesQueryInput(search), [search]);
  const query = useSuspenseQuery(trpc.course.list.queryOptions(queryInput));
  const isFetching = useIsFetching({ queryKey: trpc.course.list.queryKey() }) > 0;
  const tableState = useMemo(
    () => ({
      sorting: [{ id: search.sortBy, desc: search.sortDirection === "desc" }] as SortingState,
      pagination: {
        pageIndex: Math.floor(search.offset / search.limit),
        pageSize: search.limit,
      } as PaginationState,
      columnFilters: (search.statuses?.length
        ? [{ id: "status", value: search.statuses }]
        : []) as ColumnFiltersState,
    }),
    [search],
  );

  const table = useReactTable<CourseRow>({
    data: query.data.rows,
    columns: COURSE_COLUMNS,
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
        search: (prev: ListAdminCoursesInput) => ({
          ...prev,
          sortBy: first ? (first.id as CourseSortField) : "updatedAt",
          sortDirection: first ? (first.desc ? "desc" : "asc") : "desc",
          offset: 0,
        }),
      });
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState.pagination) : updater;

      navigate({
        search: (prev: ListAdminCoursesInput) => ({
          ...prev,
          offset: next.pageIndex * next.pageSize,
          limit: next.pageSize,
        }),
      });
    },
    onColumnFiltersChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState.columnFilters) : updater;
      const statuses = next.find((filter) => filter.id === "status")?.value as
        | CourseStatus[]
        | undefined;

      navigate({
        search: (prev: ListAdminCoursesInput) => ({
          ...prev,
          statuses: statuses?.length ? statuses : undefined,
          offset: 0,
        }),
      });
    },
  });

  const pageIndex = tableState.pagination.pageIndex;
  const pageSize = tableState.pagination.pageSize;

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <CoursesToolbar
        isFetching={isFetching}
        onRefresh={query.refetch}
        onSearchChange={setSearchInput}
        onViewChange={(view: CourseViewMode) =>
          navigate({
            search: (prev: ListAdminCoursesInput) => ({ ...prev, view }),
          })
        }
        search={searchInput}
        view={search.view}
      />

      <CoursesFilters table={table} />

      {search.view === "cards" ? (
        <CoursesCardGrid
          courses={query.data.rows}
          onPageChange={(nextPageIndex) =>
            navigate({
              search: (prev: ListAdminCoursesInput) => ({
                ...prev,
                offset: nextPageIndex * pageSize,
              }),
            })
          }
          onPageSizeChange={(nextPageSize) =>
            navigate({
              search: (prev: ListAdminCoursesInput) => ({
                ...prev,
                limit: nextPageSize,
                offset: 0,
              }),
            })
          }
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalCount={query.data.totalCount}
        />
      ) : (
        <DataTable<CourseRow> emptyMessage="No courses yet." table={table} />
      )}
    </div>
  );
}
