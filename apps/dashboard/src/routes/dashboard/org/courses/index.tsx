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

import { OrgCoursesCardGrid } from "@/components/dashboard/org/courses/org-courses-card-grid";
import { ORG_COURSE_COLUMNS } from "@/components/dashboard/org/courses/org-courses-columns";
import { OrgCoursesFilters } from "@/components/dashboard/org/courses/org-courses-filters";
import {
  getOrgCoursesQueryInput,
  listOrgCoursesSchema,
  type ListOrgCoursesInput,
  type OrgCourseRow,
  type OrgCourseSortField,
  type OrgCourseViewMode,
  type CourseStatus,
  type DifficultyLevel,
} from "@/components/dashboard/org/courses/org-courses-schema";
import { OrgCoursesToolbar } from "@/components/dashboard/org/courses/org-courses-toolbar";
import { DataTable } from "@/components/dashboard/data-table";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useTRPC } from "@/lib/trpc/client";

export const Route = createFileRoute("/dashboard/org/courses/")({
  head: () => ({
    meta: [{ title: "Courses | Organization | Sycom LMS" }],
  }),
  validateSearch: listOrgCoursesSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.orgCourse.list.queryOptions(getOrgCoursesQueryInput(deps)),
    );
    await context.queryClient.ensureQueryData(
      context.trpc.course.listCategories.queryOptions({
        limit: 200,
        offset: 0,
        sortBy: "name",
        sortDirection: "asc",
      }),
    );
  },
  component: OrgCoursesCatalogPage,
});

function OrgCoursesCatalogPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();
  const { searchInput, setSearchInput } = useDebouncedSearch({
    committedValue: search.search,
    delayMs: 600,
    onDebouncedCommit: (next) =>
      navigate({
        replace: true,
        search: (prev: ListOrgCoursesInput) => ({ ...prev, search: next, offset: 0 }),
      }),
  });

  const queryInput = useMemo(() => getOrgCoursesQueryInput(search), [search]);
  const query = useSuspenseQuery(trpc.orgCourse.list.queryOptions(queryInput));
  const isFetching = useIsFetching({ queryKey: trpc.orgCourse.list.queryKey() }) > 0;
  const tableState = useMemo(
    () => ({
      sorting: [{ id: search.sortBy, desc: search.sortDirection === "desc" }] as SortingState,
      pagination: {
        pageIndex: Math.floor(search.offset / search.limit),
        pageSize: search.limit,
      } as PaginationState,
      columnFilters: [
        ...(search.statuses?.length ? [{ id: "status", value: search.statuses }] : []),
        ...(search.difficulties?.length ? [{ id: "difficulty", value: search.difficulties }] : []),
        ...(search.categoryIds?.length ? [{ id: "categories", value: search.categoryIds }] : []),
      ] as ColumnFiltersState,
    }),
    [search],
  );

  const table = useReactTable<OrgCourseRow>({
    data: query.data.rows,
    columns: ORG_COURSE_COLUMNS,
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
        search: (prev: ListOrgCoursesInput) => ({
          ...prev,
          sortBy: first ? (first.id as OrgCourseSortField) : "updatedAt",
          sortDirection: first ? (first.desc ? "desc" : "asc") : "desc",
          offset: 0,
        }),
      });
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(tableState.pagination) : updater;

      navigate({
        search: (prev: ListOrgCoursesInput) => ({
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
      const difficulties = next.find((filter) => filter.id === "difficulty")?.value as
        | DifficultyLevel[]
        | undefined;
      const categoryIds = next.find((filter) => filter.id === "categories")?.value as
        | string[]
        | undefined;

      navigate({
        search: (prev: ListOrgCoursesInput) => ({
          ...prev,
          statuses: statuses?.length ? statuses : undefined,
          difficulties: difficulties?.length ? difficulties : undefined,
          categoryIds: categoryIds?.length ? categoryIds : undefined,
          offset: 0,
        }),
      });
    },
  });

  const pageIndex = tableState.pagination.pageIndex;
  const pageSize = tableState.pagination.pageSize;

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <OrgCoursesToolbar
        isFetching={isFetching}
        onRefresh={query.refetch}
        onSearchChange={setSearchInput}
        onViewChange={(view: OrgCourseViewMode) =>
          navigate({
            search: (prev: ListOrgCoursesInput) => ({ ...prev, view }),
          })
        }
        search={searchInput}
        view={search.view}
      />

      <OrgCoursesFilters table={table} />

      {search.view === "cards" ? (
        <OrgCoursesCardGrid
          courses={query.data.rows}
          onPageChange={(nextPageIndex) =>
            navigate({
              search: (prev: ListOrgCoursesInput) => ({
                ...prev,
                offset: nextPageIndex * pageSize,
              }),
            })
          }
          onPageSizeChange={(nextPageSize) =>
            navigate({
              search: (prev: ListOrgCoursesInput) => ({
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
        <DataTable<OrgCourseRow> emptyMessage="No courses yet." table={table} />
      )}
    </div>
  );
}
