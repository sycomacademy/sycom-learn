import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type RowSelectionState,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DataTable } from "@/components/dashboard/data-table";
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
} from "@sycom/ui/components/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@sycom/ui/components/input-group";
import { Spinner } from "@sycom/ui/components/spinner";
import { toastManager } from "@sycom/ui/components/toast";

/** Narrow row model for the table — avoids retaining large nested admin payloads per row. */
type SeedOrgRow = {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
};

const columnHelper = createColumnHelper<SeedOrgRow>();

/** Module-level stable reference — passing a new columns array each render can thrash TanStack Table internals. */
const SEED_ORGANIZATION_COLUMNS = [
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all organizations on page"
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
    header: "Organization",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.original.name}</p>
        <p className="truncate text-xs text-muted-foreground">{row.original.slug}</p>
      </div>
    ),
  }),
  columnHelper.accessor("memberCount", {
    header: "Members",
    cell: ({ row }) => <Badge variant="secondary">{row.original.memberCount}</Badge>,
  }),
];

type SeedCourseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
};

export function SeedCourseDialog({
  courseId,
  courseTitle,
  onOpenChange,
  open,
}: SeedCourseDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const orgsQuery = useQuery({
    ...trpc.admin.listOrganizations.queryOptions({
      limit: 50,
      offset: 0,
      search: debouncedSearch || undefined,
      sortBy: "name",
      sortDirection: "asc",
    }),
    enabled: open,
    placeholderData: (previousData) => previousData,
  });

  const seedMutation = useMutation({
    ...trpc.course.seed.mutationOptions({
      onSuccess: async ({ seeded }) => {
        toastManager.add({
          title: "Course seeded",
          description: `${courseTitle} was seeded into ${seeded.length} organization${seeded.length === 1 ? "" : "s"}.`,
          type: "success",
        });
        onOpenChange(false);
        setRowSelection({});
        setSearchInput("");
        setDebouncedSearch("");
        await queryClient.invalidateQueries({ queryKey: trpc.course.list.queryKey() });
      },
      onError: (error) => {
        toastManager.add({
          title: "Couldn't seed course",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  const rows = useMemo(
    () =>
      (orgsQuery.data?.rows ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        memberCount: r.memberCount,
      })),
    [orgsQuery.data?.rows],
  );

  const table = useReactTable({
    data: rows,
    columns: SEED_ORGANIZATION_COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    initialState: {
      pagination: { pageSize: 50, pageIndex: 0 },
    },
  });

  const selectedOrganizationIds = table.getSelectedRowModel().rows.map((row) => row.original.id);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setRowSelection({});
      setSearchInput("");
      setDebouncedSearch("");
    }
  };

  const showInitialSpinner = open && orgsQuery.isPending && orgsQuery.data === undefined;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogPopup className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Seed course to organizations</DialogTitle>
          <DialogDescription>
            Each selected organization receives an independent draft copy of{" "}
            <strong>{courseTitle}</strong>. Future edits to the public course do <em>not</em>{" "}
            propagate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-6 py-4">
          <InputGroup className="w-full max-w-md">
            <InputGroupAddon align="inline-start">
              <Search className="size-4 opacity-60" />
            </InputGroupAddon>
            <InputGroupInput
              onChange={(event) => setSearchInput(event.currentTarget.value)}
              placeholder="Search organizations..."
              type="search"
              value={searchInput}
            />
          </InputGroup>

          {showInitialSpinner ? (
            <div className="flex min-h-32 items-center justify-center">
              <Spinner className="size-5" />
            </div>
          ) : (
            <DataTable emptyMessage="No organizations match your search." table={table} />
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            disabled={selectedOrganizationIds.length === 0}
            loading={seedMutation.isPending}
            onClick={() =>
              seedMutation.mutate({ courseId, organizationIds: selectedOrganizationIds })
            }
          >
            Seed selected ({selectedOrganizationIds.length})
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
