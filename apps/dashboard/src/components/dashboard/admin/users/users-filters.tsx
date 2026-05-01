import type { UserRole } from "@sycom/db/schema/auth";
import { FilterCombobox, type FilterOption } from "@sycom/ui/components/filter-combobox";
import type { Table } from "@tanstack/react-table";
import { ROLE_OPTIONS, STATUS_LABELS } from "./users-schema";
import { adminUserStatusSchema, type AdminUserStatus } from "./users-schema";
import type { UserRow } from "./users-schema";

const roleOptions: FilterOption[] = ROLE_OPTIONS.map((option) => ({ ...option }));

const STATUS_OPTIONS: FilterOption[] = adminUserStatusSchema.options.map(
  (value: AdminUserStatus) => ({
    value,
    label: STATUS_LABELS[value],
  }),
);

export type UsersFiltersProps = {
  table: Table<UserRow>;
};

export function UsersFilters({ table }: UsersFiltersProps) {
  const roles = (table.getColumn("role")?.getFilterValue() as UserRole[] | undefined) ?? [];
  const statuses =
    (table.getColumn("status")?.getFilterValue() as AdminUserStatus[] | undefined) ?? [];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterCombobox
        allLabel="All roles"
        label="Role"
        onValueChange={(values) =>
          table.getColumn("role")?.setFilterValue(values.length ? values : undefined)
        }
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
        onValueChange={(values) =>
          table.getColumn("status")?.setFilterValue(values.length ? values : undefined)
        }
        options={STATUS_OPTIONS}
        value={statuses}
      />
    </div>
  );
}
