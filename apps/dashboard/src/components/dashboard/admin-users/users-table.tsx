import { Button } from "@sycom/ui/components/button";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@sycom/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sycom/ui/components/table";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@sycom/ui/components/tooltip";
import { Skeleton } from "@sycom/ui/components/skeleton";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import type { AdminUsersRow } from "./users-table-columns";
import { UsersTableSkeleton } from "./users-table-skeleton";

interface UsersTableProps {
  columns: ColumnDef<AdminUsersRow>[];
  rows: AdminUsersRow[];
  page: number;
  pageCount: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  totalCount: number;
  isPending: boolean;
  hasFetchedData: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function UsersTable({
  columns,
  rows,
  page,
  pageCount,
  pageSize,
  pageSizeOptions,
  totalCount,
  isPending,
  hasFetchedData,
  onPageChange,
  onPageSizeChange,
}: UsersTableProps) {
  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualPagination: true,
    pageCount,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize,
      },
    },
  });

  const canGoPrevious = page > 1;
  const canGoNext = page < pageCount;
  const resultsStart = totalCount ? (page - 1) * pageSize + 1 : 0;
  const resultsEnd = totalCount ? Math.min(page * pageSize, totalCount) : 0;

  if (isPending && !hasFetchedData) {
    return (
      <div className="flex flex-col gap-4">
        <UsersTableSkeleton columnCount={columns.length} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Rows per page</span>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="size-8" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="size-8" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
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
              onPageSizeChange(Number(value));
            }}
            value={String(pageSize)}
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
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  aria-label="Go to previous page"
                  disabled={!canGoPrevious}
                  onClick={() => {
                    if (canGoPrevious) {
                      onPageChange(page - 1);
                    }
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
          <span className="text-sm text-foreground tabular-nums">
            {page} <span className="text-muted-foreground">/ {pageCount}</span>
          </span>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  aria-label="Go to next page"
                  disabled={!canGoNext}
                  onClick={() => {
                    if (canGoNext) {
                      onPageChange(page + 1);
                    }
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
        </div>
      </div>
    </div>
  );
}
