import { FilterCombobox, type FilterOption } from "@sycom/ui/components/filter-combobox";
import type { Table } from "@tanstack/react-table";
import type { ReactNode } from "react";

import {
  feedbackReportStatusSchema,
  feedbackReportTypeSchema,
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  type FeedbackReportStatus,
  type FeedbackReportType,
  type ReportRow,
} from "./reports-schema";

const STATUS_OPTIONS: FilterOption[] = feedbackReportStatusSchema.options.map((value) => ({
  value,
  label: REPORT_STATUS_LABELS[value],
}));

const TYPE_OPTIONS: FilterOption[] = feedbackReportTypeSchema.options.map((value) => ({
  value,
  label: REPORT_TYPE_LABELS[value],
}));

export type ReportsFiltersProps = {
  table: Table<ReportRow>;
};

export function ReportsFilters({ table }: ReportsFiltersProps): ReactNode {
  const statuses =
    (table.getColumn("status")?.getFilterValue() as FeedbackReportStatus[] | undefined) ?? [];
  const types =
    (table.getColumn("type")?.getFilterValue() as FeedbackReportType[] | undefined) ?? [];

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
            ?.setFilterValue(values.length ? (values as FeedbackReportStatus[]) : undefined)
        }
        options={STATUS_OPTIONS}
        value={statuses}
      />
      <FilterCombobox
        allLabel="All types"
        formatTriggerLabel={(_, selected) => {
          if (selected.length === 0) return "All types";
          if (selected.length === 1) return selected[0]?.label ?? "All types";
          return `${selected.length} types`;
        }}
        label="Type"
        onValueChange={(values) =>
          table
            .getColumn("type")
            ?.setFilterValue(values.length ? (values as FeedbackReportType[]) : undefined)
        }
        options={TYPE_OPTIONS}
        value={types}
      />
    </div>
  );
}
