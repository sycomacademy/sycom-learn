import { Button } from "@sycom/ui/components/button";
import { FilterCombobox, type FilterOption } from "@sycom/ui/components/filter-combobox";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@sycom/ui/components/input-group";
import { Spinner } from "@sycom/ui/components/spinner";
import { COURSE_STATUSES, type CourseStatus } from "@sycom/db/schema/catalog";
import { cn } from "@sycom/ui/lib/utils";
import { Plus, RefreshCcw, Search } from "lucide-react";
import type { ReactNode } from "react";

const STATUS_LABELS: Record<CourseStatus, string> = {
  draft: "Draft",
  published: "Published",
};

const STATUS_OPTIONS: FilterOption[] = COURSE_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));

export type CoursesToolbarProps = {
  search: string;
  onSearchChange: (next: string) => void;
  statuses: CourseStatus[];
  onStatusesChange: (next: CourseStatus[]) => void;
  isFetching?: boolean;
  onRefresh?: () => void;
  onNewCourse?: () => void;
};

export function CoursesToolbar({
  isFetching = false,
  onNewCourse,
  onRefresh,
  onSearchChange,
  onStatusesChange,
  search,
  statuses,
}: CoursesToolbarProps): ReactNode {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="min-w-0 flex-1">
        <label className="sr-only" htmlFor="courses-search">
          Search by course title or slug
        </label>
        <InputGroup className="w-full max-w-md">
          <InputGroupAddon align="inline-start">
            {isFetching ? <Spinner className="size-4" /> : <Search className="size-4 opacity-60" />}
          </InputGroupAddon>
          <InputGroupInput
            id="courses-search"
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            placeholder="Search by title or slug..."
            type="search"
            value={search}
          />
        </InputGroup>
      </div>

      <FilterCombobox
        allLabel="All statuses"
        formatTriggerLabel={(_, selected) => {
          if (selected.length === 0) return "All statuses";
          if (selected.length === 1) return selected[0]?.label ?? "All statuses";
          return `${selected.length} statuses`;
        }}
        label="Status"
        onValueChange={(values) => onStatusesChange(values as CourseStatus[])}
        options={STATUS_OPTIONS}
        value={statuses}
      />

      <Button
        aria-label="Refresh"
        disabled={isFetching}
        onClick={onRefresh}
        size="icon"
        variant="outline"
      >
        <RefreshCcw className={cn(isFetching ? "animate-spin" : "", "size-4")} />
      </Button>

      <Button onClick={onNewCourse}>
        <Plus className="size-4" />
        New course
      </Button>
    </div>
  );
}
