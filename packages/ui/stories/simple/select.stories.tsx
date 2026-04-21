import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Select,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectLabel,
  SelectPopup,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@sycom/ui/components/select";

const fontItems: { label: string; value: string }[] = [
  { value: "sans", label: "Sans-serif" },
  { value: "serif", label: "Serif" },
  { value: "mono", label: "Monospace" },
];

const fullItems: { label: string; value: null | string }[] = [
  { value: null, label: "Select…" },
  { value: "red", label: "Red" },
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
];

const meta = {
  title: "Simple/Select",
  component: Select,
  tags: ["autodocs"],
  args: {
    defaultValue: "sans",
    disabled: false,
    modal: true,
  },
} satisfies Meta<typeof Select<string>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Select
      defaultValue={args.defaultValue}
      disabled={args.disabled}
      items={fontItems}
      modal={args.modal}
    >
      <SelectLabel className="text-sm text-muted-foreground">Font</SelectLabel>
      <SelectTrigger className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {fontItems.map((item) => (
          <SelectItem key={String(item.value)} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  ),
};

export const Disabled: Story = {
  args: { defaultValue: "sans", disabled: true },
  render: (args) => (
    <Select defaultValue={args.defaultValue} disabled={args.disabled} items={fontItems}>
      <SelectTrigger className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {fontItems.map((item) => (
          <SelectItem key={String(item.value)} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  ),
};

export const WithPlaceholder: Story = {
  render: () => (
    <Select defaultValue={null} items={fullItems} required>
      <SelectTrigger className="w-56" size="default">
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {fullItems
          .filter((item) => item.value !== null)
          .map((item) => (
            <SelectItem key={String(item.value)} value={item.value as string}>
              {item.label}
            </SelectItem>
          ))}
      </SelectPopup>
    </Select>
  ),
};

export const LargeTrigger: Story = {
  args: { defaultValue: "mono" as string },
  render: (args) => (
    <Select defaultValue={args.defaultValue} items={fontItems}>
      <SelectTrigger className="w-56" size="lg">
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {fontItems.map((item) => (
          <SelectItem key={String(item.value)} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select defaultValue="apple" modal={false}>
      <SelectTrigger className="w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        <SelectGroup>
          <SelectGroupLabel>Fruit</SelectGroupLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectGroupLabel>Vegetable</SelectGroupLabel>
          <SelectItem value="carrot">Carrot</SelectItem>
          <SelectItem disabled value="spinach">
            Spinach
          </SelectItem>
        </SelectGroup>
      </SelectPopup>
    </Select>
  ),
};
