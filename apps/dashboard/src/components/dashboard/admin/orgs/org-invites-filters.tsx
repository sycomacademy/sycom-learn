import { organizationRoleEnum, type OrganizationRole } from "@sycom/db/schema/auth";
import { FilterCombobox, type FilterOption } from "@sycom/ui/components/filter-combobox";
import { DatePicker, type DatePickerProps } from "@sycom/ui/components/date-picker";
import type { Table } from "@tanstack/react-table";
import type { ReactNode } from "react";

import {
  ORG_INVITE_STATUS_FILTER_LABELS,
  ORG_ROLE_LABELS,
  organizationInvitationFilterStatusSchema,
  type OrgInviteRow,
  type OrgInvitesSentRange,
  type OrganizationInvitationFilterStatus,
} from "./org-invites-schema";

type DateRangeValue = DatePickerProps["value"];

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
  table: Table<OrgInviteRow>;
};

export function OrgInvitesFilters({ table }: OrgInvitesFiltersProps): ReactNode {
  const roles = (table.getColumn("role")?.getFilterValue() as OrganizationRole[] | undefined) ?? [];
  const statuses =
    (table.getColumn("status")?.getFilterValue() as
      | OrganizationInvitationFilterStatus[]
      | undefined) ?? [];
  const sentRange = table.getColumn("createdAt")?.getFilterValue() as
    | OrgInvitesSentRange
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
        allLabel="All roles"
        formatTriggerLabel={(_, selected) => {
          if (selected.length === 0) return "All roles";
          if (selected.length === 1) return selected[0]?.label ?? "All roles";
          return `${selected.length} roles`;
        }}
        label="Role"
        onValueChange={(values) =>
          table
            .getColumn("role")
            ?.setFilterValue(values.length ? (values as OrganizationRole[]) : undefined)
        }
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
        onValueChange={(values) =>
          table
            .getColumn("status")
            ?.setFilterValue(
              values.length ? (values as OrganizationInvitationFilterStatus[]) : undefined,
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
