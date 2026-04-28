import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { ReactNode } from "react";

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

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
};

export type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  totalCount?: number;
  emptyMessage?: ReactNode;
  className?: string;
};

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function DataTable<T>({
  className,
  columns,
  data,
  emptyMessage = "No results.",
  getRowId,
  onPageChange,
  onPageSizeChange,
  page,
  pageCount,
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  totalCount,
}: DataTableProps<T>): ReactNode {
  const total = totalCount ?? data.length;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const goTo = (next: number) => {
    if (next < 1 || next > pageCount || next === page) return;
    onPageChange(next);
  };

  return (
    <div className={cn("overflow-hidden rounded-lg border bg-card", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead className={c.headerClassName} key={c.id}>
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                className="h-24 text-center text-muted-foreground"
                colSpan={columns.length}
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={getRowId(row)}>
                {columns.map((c) => (
                  <TableCell className={c.className} key={c.id}>
                    {c.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col items-stretch gap-3 border-t px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Rows per page</span>
          <Select
            items={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
            onValueChange={(v) => onPageSizeChange?.(Number(v))}
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
            {total === 0 ? "No results" : `${start}–${end} of ${total}`}
          </span>
          <Pagination className="mx-0 w-auto justify-start">
            <PaginationContent className="gap-0.5">
              <PaginationItem>
                <PaginationLink
                  aria-disabled={page <= 1}
                  aria-label="Previous page"
                  className={cn(page <= 1 && "pointer-events-none opacity-50")}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(page - 1);
                  }}
                  size="icon-sm"
                >
                  <ChevronLeftIcon className="size-4" />
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  aria-disabled={page >= pageCount}
                  aria-label="Next page"
                  className={cn(page >= pageCount && "pointer-events-none opacity-50")}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    goTo(page + 1);
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
