import { FilterCombobox, type FilterOption } from "@sycom/ui/components/filter-combobox";
import { DatePicker, type DatePickerProps } from "@sycom/ui/components/date-picker";
import type { Table } from "@tanstack/react-table";
import type { ReactNode } from "react";

import {
  ACTOR_TYPE_LABELS,
  auditActorTypeSchema,
  formatEventLabel,
  type AuditActorTypeFilter,
  type AuditLogDateRange,
  type AuditLogRow,
} from "./audit-log-schema";

type DateRangeValue = DatePickerProps["value"];

const ACTOR_TYPE_OPTIONS: FilterOption[] = auditActorTypeSchema.options.map(
  (value: AuditActorTypeFilter) => ({
    value,
    label: ACTOR_TYPE_LABELS[value],
  }),
);

export type AuditLogFiltersProps = {
  eventOptions: string[];
  table: Table<AuditLogRow>;
};

export function AuditLogFilters({ eventOptions, table }: AuditLogFiltersProps): ReactNode {
  const actorTypes =
    (table.getColumn("actorType")?.getFilterValue() as AuditActorTypeFilter[] | undefined) ?? [];
  const events = (table.getColumn("event")?.getFilterValue() as string[] | undefined) ?? [];
  const dateRange = table.getColumn("createdAt")?.getFilterValue() as AuditLogDateRange | undefined;
  const selectedRange: DateRangeValue = dateRange
    ? {
        from: dateRange.from ? new Date(dateRange.from) : undefined,
        to: dateRange.to ? new Date(dateRange.to) : undefined,
      }
    : undefined;
  const eventFilterOptions: FilterOption[] = eventOptions.map((value) => ({
    value,
    label: formatEventLabel(value),
  }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterCombobox
        allLabel="All actors"
        formatTriggerLabel={(_, selected) => {
          if (selected.length === 0) return "All actors";
          if (selected.length === 1) return selected[0]?.label ?? "All actors";
          return `${selected.length} actor types`;
        }}
        label="Actor"
        onValueChange={(values) =>
          table
            .getColumn("actorType")
            ?.setFilterValue(values.length ? (values as AuditActorTypeFilter[]) : undefined)
        }
        options={ACTOR_TYPE_OPTIONS}
        value={actorTypes}
      />
      <FilterCombobox
        allLabel="All events"
        formatTriggerLabel={(_, selected) => {
          if (selected.length === 0) return "All events";
          if (selected.length === 1) return selected[0]?.label ?? "All events";
          return `${selected.length} events`;
        }}
        label="Event"
        onValueChange={(values) =>
          table.getColumn("event")?.setFilterValue(values.length ? (values as string[]) : undefined)
        }
        options={eventFilterOptions}
        value={events}
      />
      <DatePicker
        buttonProps={{ size: "sm" }}
        className="w-72"
        onValueChange={(next) =>
          table.getColumn("createdAt")?.setFilterValue(
            next?.from || next?.to
              ? {
                  from: next.from?.toISOString(),
                  to: next.to?.toISOString(),
                }
              : undefined,
          )
        }
        placeholder="Event date"
        value={selectedRange}
      />
    </div>
  );
}
