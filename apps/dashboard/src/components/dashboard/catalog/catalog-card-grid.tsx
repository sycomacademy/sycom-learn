import { BookOpenIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@sycom/ui/components/card";
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
import { Image } from "@sycom/ui/image";
import { cn } from "@sycom/ui/lib/utils";

import { COURSE_DIFFICULTY_LABELS, formatMinutes, type CatalogRow } from "./catalog-schema";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type CatalogCardProps = {
  course: CatalogRow;
};

function CatalogCard({ course }: CatalogCardProps) {
  return (
    <Card className="group overflow-hidden">
      <div className="relative">
        <Button
          className="h-auto w-full justify-start rounded-none p-0 text-left text-inherit group-hover:border-border hover:bg-inherit"
          render={
            <Link
              params={{ courseId: course.id }}
              preload="intent"
              to="/dashboard/catalog/$courseId"
            />
          }
          variant="ghost"
        >
          <div className="w-full">
            <div className="flex aspect-video w-full items-center justify-center overflow-hidden bg-muted">
              {course.imageUrl ? (
                <Image
                  alt={course.title}
                  className="size-full object-cover"
                  height={360}
                  src={course.imageUrl}
                  width={640}
                />
              ) : (
                <BookOpenIcon className="size-5 text-muted-foreground" />
              )}
              {course.enrolled ? (
                <div className="absolute top-3 right-3 z-10">
                  <Badge size="sm" variant="default">
                    Enrolled
                  </Badge>
                </div>
              ) : null}
            </div>

            <CardHeader className="pb-3">
              <CardTitle className="line-clamp-2 text-base leading-snug">{course.title}</CardTitle>
              <CardDescription className="truncate">{course.slug}</CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{COURSE_DIFFICULTY_LABELS[course.difficulty]}</Badge>
              </div>
            </CardContent>

            <CardFooter className="pt-3 text-sm text-muted-foreground">
              {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"} ·{" "}
              {formatMinutes(course.totalMinutes)}
            </CardFooter>
          </div>
        </Button>
      </div>
    </Card>
  );
}

export type CatalogCardGridProps = {
  courses: CatalogRow[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  onPageChange: (nextPageIndex: number) => void;
  onPageSizeChange: (nextPageSize: number) => void;
  pageSizeOptions?: number[];
};

export function CatalogCardGrid({
  courses,
  onPageChange,
  onPageSizeChange,
  pageIndex,
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  totalCount,
}: CatalogCardGridProps) {
  const start = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalCount);
  const canPreviousPage = pageIndex > 0;
  const canNextPage = end < totalCount;

  return (
    <div className="overflow-hidden">
      {courses.length === 0 ? (
        <div className="flex min-h-72 items-center justify-center px-6 py-10 text-center text-muted-foreground">
          No published courses match your filters.
        </div>
      ) : (
        <div className="grid gap-4 py-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CatalogCard course={course} key={course.id} />
          ))}
        </div>
      )}

      <div className="flex flex-col items-stretch gap-3 border px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Cards per page</span>
          <Select
            items={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
            onValueChange={(value) => onPageSizeChange(Number(value))}
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
                  onClick={(event) => {
                    event.preventDefault();
                    if (canPreviousPage) {
                      onPageChange(pageIndex - 1);
                    }
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
                  onClick={(event) => {
                    event.preventDefault();
                    if (canNextPage) {
                      onPageChange(pageIndex + 1);
                    }
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
