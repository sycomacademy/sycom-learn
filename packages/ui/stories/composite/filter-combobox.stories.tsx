import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import {
  FilterCombobox,
  type FilterComboboxProps,
  type FilterOption,
} from "@sycom/ui/components/filter-combobox";

const ROLE_OPTIONS: FilterOption[] = [
  { value: "admin", label: "Admin" },
  { value: "content_creator", label: "Content Creator" },
  { value: "student", label: "Student" },
];

const DEPARTMENT_OPTIONS: FilterOption[] = [
  { value: "engineering", label: "Engineering" },
  { value: "design", label: "Design" },
  { value: "product", label: "Product" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "operations", label: "Operations" },
  { value: "finance", label: "Finance" },
  { value: "legal", label: "Legal" },
  { value: "people", label: "People" },
  { value: "data", label: "Data" },
  { value: "research", label: "Research" },
  { value: "security", label: "Security" },
  { value: "platform", label: "Platform" },
  { value: "growth", label: "Growth" },
];

function FilterComboboxStory({
  defaultValue = [],
  formatTriggerLabel,
  label,
  options,
  resetWhenAllSelected = true,
}: {
  label: string;
  options: FilterOption[];
  defaultValue?: string[];
  resetWhenAllSelected?: boolean;
  formatTriggerLabel?: FilterComboboxProps["formatTriggerLabel"];
}) {
  const [value, setValue] = useState<string[]>(defaultValue);

  return (
    <div className="flex flex-col gap-3">
      <FilterCombobox
        formatTriggerLabel={formatTriggerLabel}
        label={label}
        onValueChange={setValue}
        options={options}
        resetWhenAllSelected={resetWhenAllSelected}
        value={value}
      />
      <p className="text-xs text-muted-foreground">
        Selected: {value.length === 0 ? "(none)" : value.join(", ")}
      </p>
    </div>
  );
}

const meta = {
  title: "Composite/FilterCombobox",
  component: FilterComboboxStory,
  tags: ["autodocs"],
} satisfies Meta<typeof FilterComboboxStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Role",
    options: ROLE_OPTIONS,
    resetWhenAllSelected: true,
  },
};

export const ExplicitAllSelection: Story = {
  args: {
    label: "Role",
    options: ROLE_OPTIONS,
    resetWhenAllSelected: false,
  },
};

export const Preselected: Story = {
  args: {
    label: "Role",
    options: ROLE_OPTIONS,
    defaultValue: ["content_creator"],
  },
};

export const ManyOptions: Story = {
  args: {
    label: "Department",
    options: DEPARTMENT_OPTIONS,
    resetWhenAllSelected: true,
  },
};

export const CustomTriggerLabel: Story = {
  args: {
    label: "Department",
    options: DEPARTMENT_OPTIONS,
    formatTriggerLabel: (label, selected) =>
      selected.length === 0
        ? `Filter by ${label.toLowerCase()}`
        : `${selected.length} ${label.toLowerCase()}`,
  },
};
