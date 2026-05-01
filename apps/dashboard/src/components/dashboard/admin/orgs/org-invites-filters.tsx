import { organizationRoleEnum, type OrganizationRole } from "@sycom/db/schema/auth";
import { FilterCombobox, type FilterOption } from "@sycom/ui/components/filter-combobox";
import type { ReactNode } from "react";

import { ORG_INVITE_STATUS_FILTER_LABELS, ORG_ROLE_LABELS } from "./org-invites-helpers";
import {
  organizationInvitationFilterStatusSchema,
  type OrganizationInvitationFilterStatus,
} from "./org-invites-schema";

const STATUS_OPTIONS: FilterOption[] = organizationInvitationFilterStatusSchema.options.map(
  (value: OrganizationInvitationFilterStatus) => ({
    value,
    label: ORG_INVITE_STATUS_FILTER_LABELS[value],
  }),
);

const ROLE_OPTIONS: FilterOption[] = organizationRoleEnum.enumValues.map((value) => ({
  value,
  label: ORG_ROLE_LABELS[value],
}));

export type OrgInvitesFiltersProps = {
  statuses: OrganizationInvitationFilterStatus[];
  roles: OrganizationRole[];
  onStatusesChange: (next: OrganizationInvitationFilterStatus[]) => void;
  onRolesChange: (next: OrganizationRole[]) => void;
};

export function OrgInvitesFilters({
  onRolesChange,
  onStatusesChange,
  roles,
  statuses,
}: OrgInvitesFiltersProps): ReactNode {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterCombobox
        allLabel="All roles"
        formatTriggerLabel={(_, selected) => {
          if (selected.length === 0) return "All roles";
          if (selected.length === 1) return selected[0]?.label ?? "All roles";
          return `${selected.length} roles`;
        }}
        label="Role"
        onValueChange={(values) => onRolesChange(values as OrganizationRole[])}
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
        onValueChange={(values) => onStatusesChange(values as OrganizationInvitationFilterStatus[])}
        options={STATUS_OPTIONS}
        value={statuses}
      />
    </div>
  );
}
