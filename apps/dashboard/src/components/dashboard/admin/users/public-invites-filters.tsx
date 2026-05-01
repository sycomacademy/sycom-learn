import { FilterCombobox, type FilterOption } from "@sycom/ui/components/filter-combobox";
import { DatePicker, type DatePickerProps } from "@sycom/ui/components/date-picker";
import type { Table } from "@tanstack/react-table";
import type { ReactNode } from "react";

import type { PublicInviteRow } from "./public-invites-columns";
import {
  PLATFORM_INVITE_FILTER_LABELS,
  platformInvitationFilterStatusSchema,
  type PlatformInvitationFilterStatus,
  type PublicInvitesSentRange,
} from "./public-invites-schema";

type DateRangeValue = DatePickerProps["value"];

const STATUS_OPTIONS: FilterOption[] = platformInvitationFilterStatusSchema.options.map(
  (value: PlatformInvitationFilterStatus) => ({
    value,
    label: PLATFORM_INVITE_FILTER_LABELS[value],
  }),
);

export type PublicInvitesFiltersProps = {
  table: Table<PublicInviteRow>;
};

export function PublicInvitesFilters({ table }: PublicInvitesFiltersProps): ReactNode {
  const statuses =
    (table.getColumn("status")?.getFilterValue() as PlatformInvitationFilterStatus[] | undefined) ??
    [];
  const sentRange = table.getColumn("createdAt")?.getFilterValue() as
    | PublicInvitesSentRange
    | undefined;
  const selectedRange: DateRangeValue = sentRange
    ? {
        from: sentRange.from ? new Date(sentRange.from) : undefined,
        to: sentRange.to ? new Date(sentRange.to) : undefined,
      }
    : undefined;

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
            ?.setFilterValue(
              values.length ? (values as PlatformInvitationFilterStatus[]) : undefined,
            )
        }
        options={STATUS_OPTIONS}
        value={statuses}
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
        placeholder="Sent date"
        value={selectedRange}
      />
    </div>
  );
}
