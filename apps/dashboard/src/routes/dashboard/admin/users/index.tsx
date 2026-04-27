import type { AppRouterOutputs } from "server/trpc/routers/_app";
import { Avatar, AvatarFallback } from "@sycom/ui/components/avatar";
import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@sycom/ui/components/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@sycom/ui/components/input-group";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@sycom/ui/components/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
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
import { useQuery } from "@tanstack/react-query";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PlusIcon, RefreshCwIcon, SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { useTRPC } from "@/lib/trpc/client";

const USERS_PAGE_SIZE = 10;
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const roleOptions = [
  { label: "Any role", value: "all" },
  { label: "Platform admin", value: "platform_admin" },
  { label: "Content creator", value: "content_creator" },
  { label: "Public student", value: "public_student" },
] as const;

const statusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Verified", value: "verified" },
  { label: "Banned", value: "banned" },
  { label: "Unverified", value: "unverified" },
] as const;

type UsersSearch = {
  page: number;
  q: string;
  role: UserRoleFilter;
  status: UserStatusFilter;
};

type UserRoleFilter = (typeof roleOptions)[number]["value"];
type UserStatusFilter = (typeof statusOptions)[number]["value"];
type UsersListOutput = AppRouterOutputs["admin"]["listUsers"];
type UserRow = UsersListOutput["rows"][number];

const columns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: "User",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <div className="flex max-w-64 min-w-0 items-center gap-2.5">
          <Avatar>
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground sm:hidden">{user.email}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="block max-w-xs min-w-48 truncate text-muted-foreground">
        {row.original.email}
      </span>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => formatRole(row.original.role),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => renderStatusBadge(row.original.status),
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{dateFormatter.format(row.original.createdAt)}</span>
    ),
  },
];

export const Route = createFileRoute("/dashboard/admin/users/")({
  validateSearch: (search): UsersSearch => ({
    page: parsePage(search.page),
    q: typeof search.q === "string" ? search.q.trim() : "",
    role: isRoleFilter(search.role) ? search.role : "all",
    status: isStatusFilter(search.status) ? search.status : "all",
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

  const usersQueryOptions = trpc.admin.listUsers.queryOptions(buildUsersQueryInput(search));
  const usersQuery = useQuery({
    ...usersQueryOptions,
    placeholderData: (previousData) => previousData,
  });

  const usersData = usersQuery.data;
  const rows = usersData?.rows ?? [];

  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualPagination: true,
    pageCount: usersData?.pageCount ?? 0,
    state: {
      pagination: {
        pageIndex: search.page - 1,
        pageSize: USERS_PAGE_SIZE,
      },
    },
  });

  useEffect(() => {
    setSearchValue(search.q);
  }, [search.q]);

  useEffect(() => {
    const nextQuery = searchValue.trim();

    if (nextQuery === search.q) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void navigate({
        replace: true,
        search: (previous: UsersSearch) => ({
          ...previous,
          page: 1,
          q: nextQuery,
        }),
      });
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [navigate, search.q, searchValue]);

  useEffect(() => {
    if (!usersData) {
      return;
    }

    if (usersData.pageCount > 0 && search.page > usersData.pageCount) {
      void navigate({
        replace: true,
        search: (previous: UsersSearch) => ({
          ...previous,
          page: usersData.pageCount,
        }),
      });
    }
  }, [navigate, search.page, usersData]);

  const canGoPrevious = search.page > 1;
  const canGoNext = usersData ? search.page < usersData.pageCount : false;
  const paginationItems = buildPaginationItems(search.page, usersData?.pageCount ?? 0);
  const resultsStart = usersData?.totalCount ? (search.page - 1) * USERS_PAGE_SIZE + 1 : 0;
  const resultsEnd = usersData?.totalCount
    ? Math.min(search.page * USERS_PAGE_SIZE, usersData.totalCount)
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <CardTitle className="text-sm">All users</CardTitle>
          <CardDescription className="text-sm">
            Browse every account on the platform, filter by access level or account state, and
            refresh the directory without leaving the page.
          </CardDescription>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
          <Button className="w-full sm:w-auto" disabled size="sm" type="button" variant="outline">
            <PlusIcon className="size-4" />
            Invite user
          </Button>
          <Button
            className="w-full sm:w-auto"
            loading={usersQuery.isRefetching}
            onClick={() => {
              void usersQuery.refetch();
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            <RefreshCwIcon className="size-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <div className="flex flex-col gap-3 border-t border-border/60 px-6 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Select
            onValueChange={(value) => {
              if (!isRoleFilter(value)) {
                return;
              }

              void navigate({
                replace: true,
                search: (previous: UsersSearch) => ({
                  ...previous,
                  page: 1,
                  role: value,
                }),
              });
            }}
            value={search.role}
          >
            <SelectTrigger className="w-full sm:w-40" size="sm">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) => {
              if (!isStatusFilter(value)) {
                return;
              }

              void navigate({
                replace: true,
                search: (previous: UsersSearch) => ({
                  ...previous,
                  page: 1,
                  status: value,
                }),
              });
            }}
            value={search.status}
          >
            <SelectTrigger className="w-full sm:w-40" size="sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full lg:max-w-sm lg:flex-1">
          <label className="sr-only" htmlFor="users-search">
            Search users by name or email
          </label>
          <InputGroup className="w-full">
            <InputGroupAddon align="inline-start">
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="users-search"
              onChange={(event) => {
                setSearchValue(event.target.value);
              }}
              placeholder="Search by name or email"
              size="sm"
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
      </div>

      <CardPanel className="px-0 pt-0">
        <Table variant="card">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {usersQuery.isPending && !usersData ? (
              <TableRow>
                <TableCell
                  className="h-24 text-center text-muted-foreground"
                  colSpan={columns.length}
                >
                  Loading users...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
      </CardPanel>

      <CardFooter className="flex flex-col items-stretch gap-4 border-t sm:flex-row sm:items-center sm:justify-between">
        <p className="text-center text-xs text-muted-foreground sm:text-start">
          Showing {resultsStart}-{resultsEnd} of {usersData?.totalCount ?? 0} users
        </p>

        {usersData && usersData.pageCount > 1 ? (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  aria-disabled={!canGoPrevious}
                  className={!canGoPrevious ? "pointer-events-none opacity-50" : undefined}
                  href="#previous"
                  onClick={(event) => {
                    event.preventDefault();
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
                />
              </PaginationItem>

              {paginationItems.map((item, index) => (
                <PaginationItem key={typeof item === "number" ? item : `${item}-${index}`}>
                  {item === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href={`#page-${item}`}
                      isActive={item === search.page}
                      onClick={(event) => {
                        event.preventDefault();
                        if (item === search.page) {
                          return;
                        }

                        void navigate({
                          search: (previous: UsersSearch) => ({
                            ...previous,
                            page: item,
                          }),
                        });
                      }}
                    >
                      {item}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  aria-disabled={!canGoNext}
                  className={!canGoNext ? "pointer-events-none opacity-50" : undefined}
                  href="#next"
                  onClick={(event) => {
                    event.preventDefault();
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
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
      </CardFooter>
    </Card>
  );
}

function buildUsersQueryInput(search: UsersSearch) {
  return {
    page: search.page,
    pageSize: USERS_PAGE_SIZE,
    query: search.q || undefined,
    role: search.role === "all" ? undefined : search.role,
    status: search.status === "all" ? undefined : search.status,
  };
}

function buildPaginationItems(currentPage: number, pageCount: number) {
  if (pageCount <= 1) {
    return [] as Array<number | "ellipsis">;
  }

  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", pageCount] as Array<number | "ellipsis">;
  }

  if (currentPage >= pageCount - 2) {
    return [1, "ellipsis", pageCount - 3, pageCount - 2, pageCount - 1, pageCount] as Array<
      number | "ellipsis"
    >;
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    pageCount,
  ] as Array<number | "ellipsis">;
}

function formatRole(role: UserRow["role"]) {
  if (role === "platform_admin") {
    return "Platform admin";
  }

  if (role === "content_creator") {
    return "Content creator";
  }

  if (role === "public_student") {
    return "Public student";
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

function parsePage(value: unknown) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function renderStatusBadge(status: UserRow["status"]) {
  if (status === "verified") {
    return (
      <Badge className="font-normal" size="sm" variant="success">
        Verified
      </Badge>
    );
  }

  if (status === "banned") {
    return (
      <Badge className="font-normal" size="sm" variant="error">
        Banned
      </Badge>
    );
  }

  return (
    <Badge className="font-normal" size="sm" variant="warning">
      Unverified
    </Badge>
  );
}
