import { flexRender, type RowData, type Table as TanstackTable } from "@tanstack/react-table";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon } from "lucide-react";
import type { ReactElement, ReactNode } from "react";

import { Button } from "@sycom/ui/components/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@sycom/ui/components/pagination";
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
import { cn } from "@sycom/ui/lib/utils";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
    headerClassName?: string;
  }
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export type DataTableProps<TData> = {
  table: TanstackTable<TData>;
  emptyMessage?: ReactNode;
  pageSizeOptions?: number[];
  className?: string;
};

export function DataTable<TData>({
  className,
  emptyMessage = "No results.",
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  table,
}: DataTableProps<TData>): ReactElement {
  const totalCount = table.getRowCount();
  const { pageIndex, pageSize } = table.getState().pagination;
  const start = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalCount);
  const rows = table.getRowModel().rows;
  const columnCount = table.getAllLeafColumns().length;
  const pageSizeItems = pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }));
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();

  return (
    <div className={cn("overflow-hidden rounded-lg border bg-card", className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => {
                if (header.isPlaceholder) {
                  return <TableHead key={header.id} />;
                }
                const meta = header.column.columnDef.meta;
                const canSort = header.column.getCanSort();
                const sortDir = header.column.getIsSorted();
                const headerNode = flexRender(header.column.columnDef.header, header.getContext());
                return (
                  <TableHead className={meta?.headerClassName} key={header.id}>
                    {canSort ? (
                      <Button
                        className="-mx-2 h-auto gap-1.5 px-2 py-1 font-medium text-muted-foreground hover:text-foreground"
                        onClick={header.column.getToggleSortingHandler()}
                        size="sm"
                        variant="ghost"
                      >
                        {headerNode}
                        {sortDir === "asc" ? (
                          <ChevronUpIcon className="size-3" />
                        ) : sortDir === "desc" ? (
                          <ChevronDownIcon className="size-3" />
                        ) : null}
                      </Button>
                    ) : (
                      headerNode
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell className="h-24 text-center text-muted-foreground" colSpan={columnCount}>
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta;
                  return (
                    <TableCell className={meta?.className} key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col items-stretch gap-3 border-t px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Rows per page</span>
          <Select
            items={pageSizeItems}
            onValueChange={(v) => table.setPageSize(Number(v))}
            value={String(pageSize)}
          >
            <SelectTrigger className="w-20" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {totalCount === 0 ? "No results" : `${start}–${end} of ${totalCount}`}
          </span>
          <Pagination className="mx-0 w-auto justify-start">
            <PaginationContent className="gap-0.5">
              <PaginationItem>
                <PaginationLink
                  aria-disabled={!canPreviousPage}
                  aria-label="Previous page"
                  className={cn(!canPreviousPage && "pointer-events-none opacity-50")}
                  onClick={(e) => {
                    e.preventDefault();
                    table.previousPage();
                  }}
                  size="icon-sm"
                >
                  <ChevronLeftIcon className="size-4" />
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  aria-disabled={!canNextPage}
                  aria-label="Next page"
                  className={cn(!canNextPage && "pointer-events-none opacity-50")}
                  onClick={(e) => {
                    e.preventDefault();
                    table.nextPage();
                  }}
                  size="icon-sm"
                >
                  <ChevronRightIcon className="size-4" />
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
