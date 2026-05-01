import type { UserRole } from "@sycom/db/schema/auth";
import { FilterCombobox, type FilterOption } from "@sycom/ui/components/filter-combobox";
import type { ReactNode } from "react";

import { ROLE_OPTIONS, STATUS_LABELS } from "./users-helpers";
import { adminUserStatusSchema, type AdminUserStatus } from "./users-schema";

const roleOptions: FilterOption[] = ROLE_OPTIONS.map((option) => ({ ...option }));

const STATUS_OPTIONS: FilterOption[] = adminUserStatusSchema.options.map(
  (value: AdminUserStatus) => ({
    value,
    label: STATUS_LABELS[value],
  }),
);

export type UsersFiltersProps = {
  roles: UserRole[];
  onRolesChange: (next: UserRole[]) => void;
  statuses: AdminUserStatus[];
  onStatusesChange: (next: AdminUserStatus[]) => void;
};

export function UsersFilters({
  onRolesChange,
  onStatusesChange,
  roles,
  statuses,
}: UsersFiltersProps): ReactNode {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterCombobox
        allLabel="All roles"
        label="Role"
        onValueChange={(values) => onRolesChange(values as UserRole[])}
        options={roleOptions}
        value={roles}
      />
      <FilterCombobox
        allLabel="All statuses"
        formatTriggerLabel={(_, selected) => {
          if (selected.length === 0) return "All statuses";
          if (selected.length === 1) return selected[0]?.label ?? "All statuses";
          return `${selected.length} statuses`;
        }}
        label="Status"
        onValueChange={(values) => onStatusesChange(values as AdminUserStatus[])}
        options={STATUS_OPTIONS}
        value={statuses}
      />
    </div>
  );
}
