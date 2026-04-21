import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon } from "lucide-react";

import {
  ToggleGroup,
  ToggleGroupItem,
  ToggleGroupSeparator,
} from "@sycom/ui/components/toggle-group";

const meta = {
  title: "Simple/ToggleGroup",
  component: ToggleGroup,
  tags: ["autodocs"],
  args: {
    defaultValue: ["left"],
    disabled: false,
    variant: "default" as const,
    size: "default" as const,
    orientation: "horizontal" as const,
  },
  argTypes: {
    size: { control: "select", options: ["default", "sm", "lg"] },
    variant: { control: "select", options: ["default", "outline"] },
    orientation: { control: "select", options: ["horizontal", "vertical"] },
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

const alignment = [
  { value: "left" as const, icon: AlignLeftIcon, label: "Left" },
  { value: "center" as const, icon: AlignCenterIcon, label: "Center" },
  { value: "right" as const, icon: AlignRightIcon, label: "Right" },
];

export const Playground: Story = {
  render: (args) => (
    <ToggleGroup {...args}>
      {alignment.map((item) => (
        <ToggleGroupItem aria-label={item.label} key={item.value} value={item.value}>
          <item.icon />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  ),
};

export const Outline: Story = {
  args: { variant: "outline", defaultValue: ["center"] },
  render: (args) => (
    <ToggleGroup {...args}>
      {alignment.map((item) => (
        <ToggleGroupItem aria-label={item.label} key={item.value} value={item.value}>
          <item.icon />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: ["left"] },
  render: (args) => (
    <ToggleGroup {...args} variant="outline">
      {alignment.map((item) => (
        <ToggleGroupItem aria-label={item.label} key={item.value} value={item.value}>
          <item.icon />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  ),
};

export const WithSeparator: Story = {
  args: { defaultValue: ["left"], variant: "outline" as const },
  render: (args) => (
    <ToggleGroup {...args} multiple>
      <ToggleGroupItem aria-label="Left" value="left">
        <AlignLeftIcon />
      </ToggleGroupItem>
      <ToggleGroupSeparator />
      <ToggleGroupItem aria-label="Center" value="center">
        <AlignCenterIcon />
      </ToggleGroupItem>
      <ToggleGroupItem aria-label="Right" value="right">
        <AlignRightIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Vertical: Story = {
  args: { defaultValue: ["left"], orientation: "vertical" as const, variant: "outline" as const },
  render: (args) => (
    <ToggleGroup {...args}>
      {alignment.map((item) => (
        <ToggleGroupItem aria-label={item.label} key={item.value} value={item.value}>
          <item.icon />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  ),
};

export const MultilineSelection: Story = {
  args: { defaultValue: ["left", "right"], multiple: true, variant: "outline" as const },
  render: (args) => (
    <ToggleGroup {...args}>
      {alignment.map((item) => (
        <ToggleGroupItem key={item.value} value={item.value}>
          <item.icon /> {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  ),
};
