import { FilterCombobox, type FilterOption } from "@sycom/ui/components/filter-combobox";
import type { ReactNode } from "react";

import { ACTOR_TYPE_LABELS, formatEventLabel } from "./audit-log-helpers";
import { auditActorTypeSchema, type AuditActorTypeFilter } from "./audit-log-schema";

const ACTOR_TYPE_OPTIONS: FilterOption[] = auditActorTypeSchema.options.map(
  (value: AuditActorTypeFilter) => ({
    value,
    label: ACTOR_TYPE_LABELS[value],
  }),
);

export type AuditLogFiltersProps = {
  actorTypes: AuditActorTypeFilter[];
  events: string[];
  eventOptions: string[];
  onActorTypesChange: (next: AuditActorTypeFilter[]) => void;
  onEventsChange: (next: string[]) => void;
};

export function AuditLogFilters({
  actorTypes,
  events,
  eventOptions,
  onActorTypesChange,
  onEventsChange,
}: AuditLogFiltersProps): ReactNode {
  const eventFilterOptions: FilterOption[] = eventOptions.map((value) => ({
    value,
    label: formatEventLabel(value),
  }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterCombobox
        allLabel="All actors"
        formatTriggerLabel={(_, selected) => {
          if (selected.length === 0) return "All actors";
          if (selected.length === 1) return selected[0]?.label ?? "All actors";
          return `${selected.length} actor types`;
        }}
        label="Actor"
        onValueChange={(values) => onActorTypesChange(values as AuditActorTypeFilter[])}
        options={ACTOR_TYPE_OPTIONS}
        value={actorTypes}
      />
      <FilterCombobox
        allLabel="All events"
        formatTriggerLabel={(_, selected) => {
          if (selected.length === 0) return "All events";
          if (selected.length === 1) return selected[0]?.label ?? "All events";
          return `${selected.length} events`;
        }}
        label="Event"
        onValueChange={(values) => onEventsChange(values as string[])}
        options={eventFilterOptions}
        value={events}
      />
    </div>
  );
}
