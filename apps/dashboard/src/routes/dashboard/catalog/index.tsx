import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  getCoreRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState, useTransition } from "react";

import { COURSE_COLUMNS, type CourseRow } from "@/components/dashboard/catalog/courses-columns";
import {
  listAdminCoursesSchema,
  type ListAdminCoursesInput,
} from "@/components/dashboard/catalog/courses-schema";
import { CoursesToolbar } from "@/components/dashboard/catalog/courses-toolbar";
import { CreateCourseDialog } from "@/components/dashboard/catalog/create-course-dialog";
import { DataTable } from "@/components/dashboard/data-table";
import { useTRPC } from "@/lib/trpc/client";
import type { CourseStatus } from "@sycom/db/schema/catalog";

export const Route = createFileRoute("/dashboard/catalog/")({
  validateSearch: listAdminCoursesSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(context.trpc.catalog.list.queryOptions(deps));
  },
  component: CatalogAllPage,
});

type SortField = ListAdminCoursesInput["sortBy"];

function CatalogAllPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();
  const [isSearchPending, startSearchTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(search.search ?? "");
  const [createOpen, setCreateOpen] = useState(false);

  const query = useQuery(trpc.catalog.list.queryOptions(search));

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
          search: (prev: ListAdminCoursesInput) => ({ ...prev, search: next, offset: 0 }),
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

  const table = useReactTable<CourseRow>({
    data: query.data?.rows ?? [],
    columns: COURSE_COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    state: { sorting, pagination },
    manualSorting: true,
    manualPagination: true,
    rowCount: query.data?.totalCount ?? 0,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];
      navigate({
        search: (prev: ListAdminCoursesInput) => ({
          ...prev,
          sortBy: first ? (first.id as SortField) : "updatedAt",
          sortDirection: first ? (first.desc ? "desc" : "asc") : "desc",
          offset: 0,
        }),
      });
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;
      navigate({
        search: (prev: ListAdminCoursesInput) => ({
          ...prev,
          offset: next.pageIndex * next.pageSize,
          limit: next.pageSize,
        }),
      });
    },
  });

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <CoursesToolbar
        isFetching={query.isFetching || isSearchPending}
        onNewCourse={() => setCreateOpen(true)}
        onRefresh={() => query.refetch()}
        onSearchChange={setSearchInput}
        onStatusesChange={(statuses) =>
          navigate({
            search: (prev: ListAdminCoursesInput) => ({
              ...prev,
              statuses: statuses.length === 0 ? undefined : (statuses as CourseStatus[]),
              offset: 0,
            }),
          })
        }
        search={searchInput}
        statuses={search.statuses ?? []}
      />

      <CreateCourseDialog onOpenChange={setCreateOpen} open={createOpen} />

      <DataTable<CourseRow> emptyMessage="No courses yet." table={table} />
    </div>
  );
}
