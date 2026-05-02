import type { CourseStatus, DifficultyLevel } from "@sycom/db/schema/course";
import { DIFFICULTY_LEVELS } from "@sycom/db/schema/course";
import { FilterCombobox, type FilterOption } from "@sycom/ui/components/filter-combobox";
import type { Table } from "@tanstack/react-table";

import { useTRPC } from "@/lib/trpc/client";

import { COURSE_DIFFICULTY_LABELS, COURSE_STATUS_OPTIONS, type CourseRow } from "./courses-schema";
import { useSuspenseQuery } from "@tanstack/react-query";

const STATUS_OPTIONS: FilterOption[] = COURSE_STATUS_OPTIONS.map((option) => ({ ...option }));

const DIFFICULTY_OPTIONS: FilterOption[] = DIFFICULTY_LEVELS.map((value) => ({
  value,
  label: COURSE_DIFFICULTY_LABELS[value],
}));

export type CoursesFiltersProps = {
  table: Table<CourseRow>;
};

export function CoursesFilters({ table }: CoursesFiltersProps) {
  const trpc = useTRPC();
  const statuses =
    (table.getColumn("status")?.getFilterValue() as CourseStatus[] | undefined) ?? [];
  const difficulties =
    (table.getColumn("difficulty")?.getFilterValue() as DifficultyLevel[] | undefined) ?? [];
  const categoryIds =
    (table.getColumn("categories")?.getFilterValue() as string[] | undefined) ?? [];

  const categoriesQuery = useSuspenseQuery(
    trpc.course.listCategories.queryOptions({
      limit: 200,
      offset: 0,
      sortBy: "name",
      sortDirection: "asc",
    }),
  );

  const categoryOptions: FilterOption[] = (categoriesQuery.data?.rows ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }));

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

      <FilterCombobox
        allLabel="All difficulties"
        formatTriggerLabel={(_, selected) => {
          if (selected.length === 0) return "All difficulties";
          if (selected.length === 1) return selected[0]?.label ?? "All difficulties";
          return `${selected.length} difficulties`;
        }}
        label="Difficulty"
        onValueChange={(values) =>
          table
            .getColumn("difficulty")
            ?.setFilterValue(values.length ? (values as DifficultyLevel[]) : undefined)
        }
        options={DIFFICULTY_OPTIONS}
        value={difficulties}
      />

      <FilterCombobox
        allLabel="All categories"
        formatTriggerLabel={(_, selected) => {
          if (selected.length === 0) return "All categories";
          if (selected.length === 1) return selected[0]?.label ?? "All categories";
          return `${selected.length} categories`;
        }}
        label="Categories"
        onValueChange={(values) =>
          table.getColumn("categories")?.setFilterValue(values.length ? values : undefined)
        }
        options={categoryOptions}
        resetWhenAllSelected={false}
        value={categoryIds}
      />
    </div>
  );
}
