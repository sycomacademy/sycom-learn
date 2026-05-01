import { FilterCombobox, type FilterOption } from "@sycom/ui/components/filter-combobox";
import type { ReactNode } from "react";

import { REPORT_STATUS_LABELS, REPORT_TYPE_LABELS } from "./reports-helpers";
import {
  feedbackReportStatusSchema,
  feedbackReportTypeSchema,
  type FeedbackReportStatus,
  type FeedbackReportType,
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
  statuses: FeedbackReportStatus[];
  types: FeedbackReportType[];
  onStatusesChange: (next: FeedbackReportStatus[]) => void;
  onTypesChange: (next: FeedbackReportType[]) => void;
};

export function ReportsFilters({
  onStatusesChange,
  onTypesChange,
  statuses,
  types,
}: ReportsFiltersProps): ReactNode {
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
        onValueChange={(values) => onStatusesChange(values as FeedbackReportStatus[])}
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
        onValueChange={(values) => onTypesChange(values as FeedbackReportType[])}
        options={TYPE_OPTIONS}
        value={types}
      />
    </div>
  );
}
