import type { OrganizationRole } from "@sycom/db/schema/auth";
import { FilterCombobox, type FilterOption } from "@sycom/ui/components/filter-combobox";
import type { Table } from "@tanstack/react-table";

import {
  orgMemberStatusSchema,
  ORG_ROLE_OPTIONS,
  ORG_STATUS_LABELS,
  type OrgMemberRow,
  type OrgMemberStatus,
} from "./org-members-schema";

const roleOptions: FilterOption[] = ORG_ROLE_OPTIONS.map((option) => ({ ...option }));

const STATUS_OPTIONS: FilterOption[] = orgMemberStatusSchema.options.map(
  (value: OrgMemberStatus) => ({
    value,
    label: ORG_STATUS_LABELS[value],
  }),
);

export type OrgMembersFiltersProps = {
  table: Table<OrgMemberRow>;
};

export function OrgMembersFilters({ table }: OrgMembersFiltersProps) {
  const roles = (table.getColumn("role")?.getFilterValue() as OrganizationRole[] | undefined) ?? [];
  const statuses =
    (table.getColumn("status")?.getFilterValue() as OrgMemberStatus[] | undefined) ?? [];

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
