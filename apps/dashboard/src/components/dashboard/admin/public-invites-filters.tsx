import { FilterCombobox, type FilterOption } from "@sycom/ui/components/filter-combobox";
import type { ReactNode } from "react";

import { PLATFORM_INVITE_FILTER_LABELS } from "./public-invites-helpers";
import {
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
  statuses: PlatformInvitationFilterStatus[];
  onStatusesChange: (next: PlatformInvitationFilterStatus[]) => void;
};

export function PublicInvitesFilters({
  onStatusesChange,
  statuses,
}: PublicInvitesFiltersProps): ReactNode {
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
        onValueChange={(values) => onStatusesChange(values as PlatformInvitationFilterStatus[])}
        options={STATUS_OPTIONS}
        value={statuses}
      />
    </div>
  );
}
