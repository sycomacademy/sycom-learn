import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { Avatar, AvatarFallback } from "@sycom/ui/components/avatar";
import { Button } from "@sycom/ui/components/button";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from "@sycom/ui/components/combobox";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@sycom/ui/components/input-group";
import { Pagination, PaginationContent, PaginationItem } from "@sycom/ui/components/pagination";
import {
  Select,
  SelectButton,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@sycom/ui/components/select";
import { Spinner } from "@sycom/ui/components/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sycom/ui/components/table";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@sycom/ui/components/tooltip";
import { cn } from "@sycom/ui/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useTRPC } from "@/lib/trpc/client";

const DEFAULT_PAGE_SIZE = 10;
const pageSizeOptions = [10, 25, 50] as const;
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const roleOptions = [
  { label: "Admin", value: "platform_admin" },
  { label: "Content Creator", value: "content_creator" },
  { label: "Student", value: "public_student" },
] as const;

const statusOptions = [
  { label: "Active", value: "verified" },
  { label: "Unverified email", value: "unverified" },
  { label: "Banned", value: "banned" },
] as const;

type RoleOption = (typeof roleOptions)[number];
type StatusOption = (typeof statusOptions)[number];
type UserRoleFilter = RoleOption["value"];
type UserStatusFilter = StatusOption["value"];

type UsersSearch = {
  page: number;
  pageSize: number;
  q: string;
  roles: UserRoleFilter[];
  statuses: UserStatusFilter[];
};

type UsersListOutput = AppRouterOutputs["admin"]["listUsers"];
type UserRow = UsersListOutput["rows"][number];

const columns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-9 rounded-md border border-border bg-muted/40 text-sm font-normal text-muted-foreground">
            <AvatarFallback className="rounded-md bg-transparent">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="block min-w-52 truncate text-sm text-muted-foreground">
        {row.original.email}
      </span>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <InlineChip>{formatRole(row.original.role)}</InlineChip>,
  },
  {
    id: "organizations",
    header: "Organizations",
    cell: () => <span className="text-sm text-muted-foreground">No organizations</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusChip status={row.original.status} />,
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {dateFormatter.format(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: () => (
      <div className="flex justify-end">
        <Button aria-label="User actions" size="icon-sm" type="button" variant="ghost">
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </div>
    ),
  },
];

export const Route = createFileRoute("/dashboard/admin/users/")({
  validateSearch: (search): UsersSearch => ({
    page: parsePage(search.page),
    pageSize: parsePageSize(search.pageSize),
    q: typeof search.q === "string" ? search.q.trim() : "",
    roles: parseFilterArray(search.roles, isRoleFilter),
    statuses: parseFilterArray(search.statuses, isStatusFilter),
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.admin.listUsers.queryOptions(buildUsersQueryInput(deps)),
    );
  },
  component: UsersAllPage,
});

function UsersAllPage() {
  const trpc = useTRPC();
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();
  const [searchValue, setSearchValue] = useState(search.q);
  const debouncedSearch = useDebouncedValue(searchValue, 300);

  const usersQuery = useSuspenseQuery(
    trpc.admin.listUsers.queryOptions(buildUsersQueryInput(search)),
  );

  const usersData = usersQuery.data;

  const table = useReactTable({
    columns,
    data: usersData.rows,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualPagination: true,
    pageCount: usersData.pageCount,
    state: {
      pagination: {
        pageIndex: search.page - 1,
        pageSize: search.pageSize,
      },
    },
  });

  useEffect(() => {
    setSearchValue(search.q);
  }, [search.q]);

  useEffect(() => {
    const next = debouncedSearch.trim();

    if (next === search.q) {
      return;
    }

    void navigate({
      replace: true,
      search: (previous: UsersSearch) => ({
        ...previous,
        page: 1,
        q: next,
      }),
    });
  }, [debouncedSearch, navigate, search.q]);

  const selectedRoles = roleOptions.filter((option) => search.roles.includes(option.value));
  const selectedStatuses = statusOptions.filter((option) => search.statuses.includes(option.value));

  const totalCount = usersData.totalCount;
  const pageCount = Math.max(usersData.pageCount, 1);
  const canGoPrevious = search.page > 1;
  const canGoNext = search.page < usersData.pageCount;
  const resultsStart = totalCount ? (search.page - 1) * search.pageSize + 1 : 0;
  const resultsEnd = totalCount ? Math.min(search.page * search.pageSize, totalCount) : 0;

  const updateRoles = (next: RoleOption[]) => {
    void navigate({
      replace: true,
      search: (previous: UsersSearch) => ({
        ...previous,
        page: 1,
        roles: next.map((option) => option.value),
      }),
    });
  };

  const updateStatuses = (next: StatusOption[]) => {
    void navigate({
      replace: true,
      search: (previous: UsersSearch) => ({
        ...previous,
        page: 1,
        statuses: next.map((option) => option.value),
      }),
    });
  };

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full max-w-xl">
          <label className="sr-only" htmlFor="users-search">
            Search users by name or email
          </label>
          <InputGroup className="w-full rounded-none bg-background shadow-none">
            <InputGroupAddon align="inline-start">
              <SearchIcon className="size-5 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              id="users-search"
              onChange={(event) => {
                setSearchValue(event.target.value);
              }}
              placeholder="Search by name or email..."
              type="search"
              value={searchValue}
            />
            {usersQuery.isFetching ? (
              <InputGroupAddon align="inline-end">
                <Spinner className="size-4 text-muted-foreground" />
              </InputGroupAddon>
            ) : null}
          </InputGroup>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  aria-label="Refresh users"
                  loading={usersQuery.isRefetching}
                  onClick={() => {
                    void usersQuery.refetch();
                  }}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <RefreshCwIcon className="size-4" />
                </Button>
              }
            />
            <TooltipPopup>Refresh users</TooltipPopup>
          </Tooltip>

          <Button disabled type="button">
            <PlusIcon className="size-4" />
            New invite
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <FilterCombobox
          items={roleOptions}
          label="Role"
          onChange={updateRoles}
          placeholderEmpty="All roles"
          searchPlaceholder="Search role..."
          value={selectedRoles}
        />
        <FilterCombobox
          items={statusOptions}
          label="Status"
          onChange={updateStatuses}
          placeholderEmpty="All statuses"
          searchPlaceholder="Search status..."
          value={selectedStatuses}
        />
      </div>

      <div className="overflow-hidden border border-border/80 bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className="hover:bg-transparent" key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    className="h-12 px-4 text-sm font-semibold text-foreground"
                    key={header.id}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow className="hover:bg-transparent" key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell className="px-4 py-3" key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center text-muted-foreground"
                  colSpan={columns.length}
                >
                  No users match the current search and filter combination.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>Rows per page</span>
          <Select
            onValueChange={(value) => {
              const nextPageSize = parsePageSize(value);

              void navigate({
                replace: true,
                search: (previous: UsersSearch) => ({
                  ...previous,
                  page: 1,
                  pageSize: nextPageSize,
                }),
              });
            }}
            value={String(search.pageSize)}
          >
            <SelectTrigger className="w-20 rounded-none" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
          <span className="text-foreground">
            {resultsStart}-{resultsEnd} of {totalCount}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground">
            {search.page} / {pageCount}
          </span>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        aria-label="Go to previous page"
                        disabled={!canGoPrevious}
                        onClick={() => {
                          if (!canGoPrevious) {
                            return;
                          }

                          void navigate({
                            search: (previous: UsersSearch) => ({
                              ...previous,
                              page: search.page - 1,
                            }),
                          });
                        }}
                        size="icon-sm"
                        type="button"
                        variant="outline"
                      >
                        <ChevronLeftIcon className="size-4" />
                      </Button>
                    }
                  />
                  <TooltipPopup>Previous page</TooltipPopup>
                </Tooltip>
              </PaginationItem>
              <PaginationItem>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        aria-label="Go to next page"
                        disabled={!canGoNext}
                        onClick={() => {
                          if (!canGoNext) {
                            return;
                          }

                          void navigate({
                            search: (previous: UsersSearch) => ({
                              ...previous,
                              page: search.page + 1,
                            }),
                          });
                        }}
                        size="icon-sm"
                        type="button"
                        variant="outline"
                      >
                        <ChevronRightIcon className="size-4" />
                      </Button>
                    }
                  />
                  <TooltipPopup>Next page</TooltipPopup>
                </Tooltip>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}

type FilterOption = { label: string; value: string };

function FilterCombobox<Option extends FilterOption>({
  items,
  label,
  onChange,
  placeholderEmpty,
  searchPlaceholder,
  value,
}: {
  items: readonly Option[];
  label: string;
  onChange: (next: Option[]) => void;
  placeholderEmpty: string;
  searchPlaceholder: string;
  value: Option[];
}) {
  const triggerLabel =
    value.length === 0
      ? `${label}: ${placeholderEmpty}`
      : value.length === 1 && value[0]
        ? `${label}: ${value[0].label}`
        : `${label}: ${value.length} selected`;

  return (
    <Combobox
      items={items as unknown as Option[]}
      itemToStringLabel={(item: Option) => item.label}
      multiple
      onValueChange={(next: Option[]) => onChange(next)}
      value={value}
    >
      <ComboboxTrigger
        render={<SelectButton className="w-full sm:w-64" />}
        aria-label={`Filter by ${label.toLowerCase()}`}
      >
        <ComboboxValue>{() => <span className="truncate">{triggerLabel}</span>}</ComboboxValue>
      </ComboboxTrigger>
      <ComboboxPopup
        className="w-(--anchor-width) min-w-56"
        aria-label={`Filter by ${label.toLowerCase()}`}
      >
        <div className="flex items-center gap-2 border-b p-2">
          <ComboboxInput
            className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]"
            placeholder={searchPlaceholder}
            showTrigger={false}
            startAddon={<SearchIcon />}
          />
          {value.length > 0 ? (
            <Button
              className="shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => onChange([])}
              size="sm"
              type="button"
              variant="ghost"
            >
              Reset
            </Button>
          ) : null}
        </div>
        <ComboboxEmpty>No matches.</ComboboxEmpty>
        <ComboboxList>
          {(item: Option) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => {
      window.clearTimeout(id);
    };
  }, [value, delay]);

  return debounced;
}

function buildUsersQueryInput(search: UsersSearch) {
  return {
    page: search.page,
    pageSize: search.pageSize,
    query: search.q || undefined,
    roles: search.roles.length > 0 ? search.roles : undefined,
    statuses: search.statuses.length > 0 ? search.statuses : undefined,
  };
}

function formatRole(role: UserRow["role"]) {
  if (role === "platform_admin") {
    return "Admin";
  }

  if (role === "content_creator") {
    return "Content Creator";
  }

  if (role === "public_student") {
    return "Student";
  }

  return "Unassigned";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isRoleFilter(value: unknown): value is UserRoleFilter {
  return roleOptions.some((option) => option.value === value);
}

function isStatusFilter(value: unknown): value is UserStatusFilter {
  return statusOptions.some((option) => option.value === value);
}

function parseFilterArray<T extends string>(
  raw: unknown,
  guard: (value: unknown) => value is T,
): T[] {
  const candidates = Array.isArray(raw)
    ? raw
    : typeof raw === "string" && raw.length > 0
      ? raw.split(",")
      : [];

  const seen = new Set<T>();
  for (const candidate of candidates) {
    if (guard(candidate)) {
      seen.add(candidate);
    }
  }

  return Array.from(seen);
}

function parsePage(value: unknown) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function parsePageSize(value: unknown) {
  const parsed = Number(value);

  if (pageSizeOptions.includes(parsed as (typeof pageSizeOptions)[number])) {
    return parsed;
  }

  return DEFAULT_PAGE_SIZE;
}

function InlineChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center border border-border bg-background px-2.5 py-0.5 text-sm font-medium text-foreground">
      {children}
    </span>
  );
}

function StatusChip({ status }: { status: UserRow["status"] }) {
  const statusConfig =
    status === "verified"
      ? { dot: "bg-success", label: "Active" }
      : status === "banned"
        ? { dot: "bg-destructive", label: "Banned" }
        : { dot: "bg-warning", label: "Unverified email" };

  return (
    <span className="inline-flex items-center gap-2 border border-border bg-background px-2.5 py-0.5 text-sm font-medium text-foreground">
      <span className={cn("size-2 rounded-full", statusConfig.dot)} />
      {statusConfig.label}
    </span>
  );
}
