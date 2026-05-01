import { FilterCombobox, type FilterOption } from "@sycom/ui/components/filter-combobox";
import type { Table } from "@tanstack/react-table";
import type { ReactNode } from "react";

import type { PublicInviteRow } from "./public-invites-columns";
import {
  PLATFORM_INVITE_FILTER_LABELS,
  platformInvitationFilterStatusSchema,
  type PlatformInvitationFilterStatus,
} from "./public-invites-schema";

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
          table.getColumn("status")?.setFilterValue(values.length ? values : undefined)
        }
        options={STATUS_OPTIONS}
        value={statuses}
      />
    </div>
  );
}
