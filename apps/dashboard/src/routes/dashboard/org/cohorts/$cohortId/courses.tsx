import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  type RowSelectionState,
} from "@tanstack/react-table";
import { Plus, RefreshCcw, Search, Trash2Icon } from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  cohortCoursesSearchSchema,
  getCohortCoursesListInput,
  type CohortCourseRow,
  type CohortCoursesSearchInput,
} from "@/components/dashboard/org/cohorts/cohort-courses-schema";
import { DataTable } from "@/components/dashboard/data-table";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useTRPC } from "@/lib/trpc/client";
import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";
import { Checkbox } from "@sycom/ui/components/checkbox";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@sycom/ui/components/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@sycom/ui/components/input-group";
import { Spinner } from "@sycom/ui/components/spinner";
import { toastManager } from "@sycom/ui/components/toast";
import { capitalize } from "@sycom/ui/lib/string";
import { cn } from "@sycom/ui/lib/utils";

const columnHelper = createColumnHelper<CohortCourseRow>();

function getCoursesColumns() {
  return [
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all courses on page"
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select ${row.original.title}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(value === true)}
        />
      ),
      meta: { headerClassName: "w-10", className: "w-10" },
    }),
    columnHelper.accessor("title", {
      header: "Course",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.original.title}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original.slug}</p>
        </div>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "published" ? "default" : "secondary"}>
          {capitalize(row.original.status)}
        </Badge>
      ),
    }),
  ];
}

function AddCoursesDialog({ cohortId }: { cohortId: string }): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const availableQuery = useSuspenseQuery(
    trpc.organization.listAvailableCohortCourses.queryOptions({
      cohortId,
      limit: 50,
      offset: 0,
      search: search.trim() || undefined,
    }),
  );

  const addMutation = useMutation({
    ...trpc.organization.addCohortCourses.mutationOptions({
      onSuccess: async () => {
        toastManager.add({ title: "Courses added", type: "success" });
        setRowSelection({});
        setOpen(false);
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.organization.listCohortCourses.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.organization.listAvailableCohortCourses.queryKey(),
          }),
        ]);
      },
      onError: (error) => {
        toastManager.add({
          title: "Failed to add courses",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  const table = useReactTable<CohortCourseRow>({
    data: availableQuery.data.rows,
    columns: getCoursesColumns(),
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  });

  const selectedCourseIds = table.getSelectedRowModel().rows.map((row) => row.original.courseId);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Add courses
          </Button>
        }
      />
      <DialogPopup className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add courses to cohort</DialogTitle>
          <DialogDescription>Select available organization courses to add.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-6 py-4">
          <InputGroup className="w-full max-w-md">
            <InputGroupAddon align="inline-start">
              <Search className="size-4 opacity-60" />
            </InputGroupAddon>
            <InputGroupInput
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Search available courses..."
              type="search"
              value={search}
            />
          </InputGroup>

          <DataTable emptyMessage="No available courses." table={table} />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={selectedCourseIds.length === 0}
            loading={addMutation.isPending}
            onClick={() => addMutation.mutate({ cohortId, courseIds: selectedCourseIds })}
          >
            Add selected ({selectedCourseIds.length})
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

export const Route = createFileRoute("/dashboard/org/cohorts/$cohortId/courses")({
  head: () => ({
    meta: [{ title: "Cohort Courses | Organization | Sycom LMS" }],
  }),
  validateSearch: cohortCoursesSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps, params }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.organization.listCohortCourses.queryOptions(
        getCohortCoursesListInput({
          cohortId: params.cohortId,
          limit: deps.limit,
          offset: deps.offset,
          search: deps.search,
        }),
      ),
    );
  },
  component: CohortCoursesPage,
});

function CohortCoursesPage() {
  const { cohortId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { searchInput, setSearchInput } = useDebouncedSearch({
    committedValue: search.search,
    delayMs: 300,
    onDebouncedCommit: (next) =>
      navigate({
        replace: true,
        search: (prev: CohortCoursesSearchInput) => ({ ...prev, search: next, offset: 0 }),
      }),
  });

  const listQuery = useSuspenseQuery(
    trpc.organization.listCohortCourses.queryOptions(
      getCohortCoursesListInput({
        cohortId,
        search: search.search,
        limit: search.limit,
        offset: search.offset,
      }),
    ),
  );

  const removeMutation = useMutation({
    ...trpc.organization.removeCohortCourses.mutationOptions({
      onSuccess: async () => {
        toastManager.add({ title: "Courses removed", type: "success" });
        setRowSelection({});
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.organization.listCohortCourses.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.organization.listAvailableCohortCourses.queryKey(),
          }),
        ]);
      },
      onError: (error) => {
        toastManager.add({
          title: "Failed to remove courses",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  const table = useReactTable<CohortCourseRow>({
    data: listQuery.data.rows,
    columns: getCoursesColumns(),
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    manualPagination: true,
    rowCount: listQuery.data.totalCount,
    state: {
      rowSelection,
      pagination: {
        pageIndex: Math.floor(search.offset / search.limit),
        pageSize: search.limit,
      },
    },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const current = {
        pageIndex: Math.floor(search.offset / search.limit),
        pageSize: search.limit,
      };
      const next = typeof updater === "function" ? updater(current) : updater;
      navigate({
        search: (prev: CohortCoursesSearchInput) => ({
          ...prev,
          offset: next.pageIndex * next.pageSize,
          limit: next.pageSize,
        }),
      });
    },
  });

  const selectedCourseIds = table.getSelectedRowModel().rows.map((row) => row.original.courseId);
  const isFetching = listQuery.isFetching;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <InputGroup className="w-full max-w-md">
            <InputGroupAddon align="inline-start">
              {isFetching ? (
                <Spinner className="size-4" />
              ) : (
                <Search className="size-4 opacity-60" />
              )}
            </InputGroupAddon>
            <InputGroupInput
              onChange={(event) => setSearchInput(event.currentTarget.value)}
              placeholder="Search cohort courses..."
              type="search"
              value={searchInput}
            />
          </InputGroup>
        </div>

        <Button
          aria-label="Refresh"
          disabled={isFetching}
          onClick={() => void listQuery.refetch()}
          size="icon"
          variant="outline"
        >
          <RefreshCcw className={cn(isFetching ? "animate-spin" : "", "size-4")} />
        </Button>

        <AddCoursesDialog cohortId={cohortId} />

        <Button
          disabled={selectedCourseIds.length === 0}
          loading={removeMutation.isPending}
          onClick={() => removeMutation.mutate({ cohortId, courseIds: selectedCourseIds })}
          variant="destructive"
        >
          <Trash2Icon className="size-4" />
          Remove selected ({selectedCourseIds.length})
        </Button>
      </div>

      <DataTable emptyMessage="No cohort courses yet." table={table} />
    </div>
  );
}
