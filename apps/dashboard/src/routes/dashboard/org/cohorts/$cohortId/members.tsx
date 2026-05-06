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
  cohortMembersSearchSchema,
  getCohortMembersListInput,
  type CohortMemberRow,
  type CohortMembersSearchInput,
} from "@/components/dashboard/org/cohorts/cohort-members-schema";
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
import { cn } from "@sycom/ui/lib/utils";
import { capitalize } from "@sycom/ui/lib/string";

const columnHelper = createColumnHelper<CohortMemberRow>();

function getMembersColumns() {
  return [
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all members on page"
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select ${row.original.name}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(value === true)}
        />
      ),
      meta: { headerClassName: "w-10", className: "w-10" },
    }),
    columnHelper.accessor("name", {
      header: "Member",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.original.name}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    }),
    columnHelper.accessor("role", {
      header: "Role",
      cell: ({ row }) => <Badge variant="outline">{capitalize(row.original.role)}</Badge>,
    }),
  ];
}

function AddMembersDialog({ cohortId }: { cohortId: string }): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const availableQuery = useSuspenseQuery(
    trpc.organization.listAvailableCohortMembers.queryOptions({
      cohortId,
      limit: 50,
      offset: 0,
      search: search.trim() || undefined,
    }),
  );

  const addMutation = useMutation({
    ...trpc.organization.addCohortMembers.mutationOptions({
      onSuccess: async () => {
        toastManager.add({ title: "Members added", type: "success" });
        setRowSelection({});
        setOpen(false);
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.organization.listCohortMembers.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.organization.listAvailableCohortMembers.queryKey(),
          }),
          queryClient.invalidateQueries({ queryKey: trpc.organization.getCohort.queryKey() }),
        ]);
      },
      onError: (error) => {
        toastManager.add({
          title: "Failed to add members",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  const table = useReactTable<CohortMemberRow>({
    data: availableQuery.data.rows,
    columns: getMembersColumns(),
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  });

  const selectedUserIds = table.getSelectedRowModel().rows.map((row) => row.original.userId);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Add members
          </Button>
        }
      />
      <DialogPopup className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add members to cohort</DialogTitle>
          <DialogDescription>Select available organization members to add.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-6 py-4">
          <InputGroup className="w-full max-w-md">
            <InputGroupAddon align="inline-start">
              <Search className="size-4 opacity-60" />
            </InputGroupAddon>
            <InputGroupInput
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Search available members..."
              type="search"
              value={search}
            />
          </InputGroup>

          <DataTable emptyMessage="No available members." table={table} />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={selectedUserIds.length === 0}
            loading={addMutation.isPending}
            onClick={() => addMutation.mutate({ cohortId, userIds: selectedUserIds })}
          >
            Add selected ({selectedUserIds.length})
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

export const Route = createFileRoute("/dashboard/org/cohorts/$cohortId/members")({
  head: () => ({
    meta: [{ title: "Cohort Members | Organization | Sycom LMS" }],
  }),
  validateSearch: cohortMembersSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps, params }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.organization.listCohortMembers.queryOptions(
        getCohortMembersListInput({
          cohortId: params.cohortId,
          limit: deps.limit,
          offset: deps.offset,
          search: deps.search,
        }),
      ),
    );
  },
  component: CohortMembersPage,
});

function CohortMembersPage() {
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
        search: (prev: CohortMembersSearchInput) => ({ ...prev, search: next, offset: 0 }),
      }),
  });

  const listQuery = useSuspenseQuery(
    trpc.organization.listCohortMembers.queryOptions(
      getCohortMembersListInput({
        cohortId,
        search: search.search,
        limit: search.limit,
        offset: search.offset,
      }),
    ),
  );

  const removeMutation = useMutation({
    ...trpc.organization.removeCohortMembers.mutationOptions({
      onSuccess: async () => {
        toastManager.add({ title: "Members removed", type: "success" });
        setRowSelection({});
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.organization.listCohortMembers.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.organization.listAvailableCohortMembers.queryKey(),
          }),
          queryClient.invalidateQueries({ queryKey: trpc.organization.getCohort.queryKey() }),
        ]);
      },
      onError: (error) => {
        toastManager.add({
          title: "Failed to remove members",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  const table = useReactTable<CohortMemberRow>({
    data: listQuery.data.rows,
    columns: getMembersColumns(),
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
        search: (prev: CohortMembersSearchInput) => ({
          ...prev,
          offset: next.pageIndex * next.pageSize,
          limit: next.pageSize,
        }),
      });
    },
  });

  const selectedUserIds = table.getSelectedRowModel().rows.map((row) => row.original.userId);
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
              placeholder="Search cohort members..."
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

        <AddMembersDialog cohortId={cohortId} />
        <Button
          disabled={selectedUserIds.length === 0}
          loading={removeMutation.isPending}
          onClick={() => removeMutation.mutate({ cohortId, userIds: selectedUserIds })}
          variant="destructive"
        >
          <Trash2Icon className="size-4" />
          Remove selected ({selectedUserIds.length})
        </Button>
      </div>

      <DataTable emptyMessage="No cohort members yet." table={table} />
    </div>
  );
}
