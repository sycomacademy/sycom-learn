import type { CourseStatus } from "@sycom/db/schema/catalog";
import { FilterCombobox, type FilterOption } from "@sycom/ui/components/filter-combobox";
import type { Table } from "@tanstack/react-table";

import { COURSE_STATUS_OPTIONS, type CourseRow } from "./courses-schema";

const STATUS_OPTIONS: FilterOption[] = COURSE_STATUS_OPTIONS.map((option) => ({ ...option }));

export type CoursesFiltersProps = {
  table: Table<CourseRow>;
};

export function CoursesFilters({ table }: CoursesFiltersProps) {
  const statuses =
    (table.getColumn("status")?.getFilterValue() as CourseStatus[] | undefined) ?? [];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterCombobox
        allLabel="All statuses"
        formatTriggerLabel={(_, selected) => {
          if (selected.length === 0) return "All statuses";
          if (selected.length === 1) return selected[0]?.label ?? "All statuses";
          return `${selected.length} statuses`;
        }}
        label="Status"
        onValueChange={(values) =>
          table
            .getColumn("status")
            ?.setFilterValue(values.length ? (values as CourseStatus[]) : undefined)
        }
        options={STATUS_OPTIONS}
        value={statuses}
      />
    </div>
  );
}
