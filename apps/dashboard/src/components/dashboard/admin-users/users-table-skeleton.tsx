import { Skeleton } from "@sycom/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sycom/ui/components/table";

export function UsersTableSkeleton({
  columnCount,
  rowCount = 8,
}: {
  columnCount: number;
  rowCount?: number;
}) {
  return (
    <div className="overflow-hidden border border-border/80 bg-background">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {Array.from({ length: columnCount }).map((_, index) => (
              <TableHead className="h-12 px-4" key={index}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <TableRow className="hover:bg-transparent" key={rowIndex}>
              <TableCell className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-md" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell className="px-4 py-3">
                <Skeleton className="h-6 w-24" />
              </TableCell>
              <TableCell className="px-4 py-3">
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell className="px-4 py-3">
                <Skeleton className="h-6 w-28" />
              </TableCell>
              <TableCell className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex justify-end">
                  <Skeleton className="size-8" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
