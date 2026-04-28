import type { ReactNode } from "react";

import { FilterCombobox, type FilterOption } from "@sycom/ui/components/filter-combobox";

const ROLE_OPTIONS: FilterOption[] = [
  { value: "platform_admin", label: "Admin" },
  { value: "content_creator", label: "Content Creator" },
  { value: "public_student", label: "Student" },
];

const STATUS_OPTIONS: FilterOption[] = [
  { value: "active", label: "Active" },
  { value: "unverified", label: "Unverified email" },
  { value: "banned", label: "Banned" },
];

export type UsersFiltersProps = {
  roles: string[];
  onRolesChange: (next: string[]) => void;
  statuses: string[];
  onStatusesChange: (next: string[]) => void;
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
        onValueChange={onRolesChange}
        options={ROLE_OPTIONS}
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
        onValueChange={onStatusesChange}
        options={STATUS_OPTIONS}
        value={statuses}
      />
    </div>
  );
}
