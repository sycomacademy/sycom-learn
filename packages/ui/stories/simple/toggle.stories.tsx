import type { Meta, StoryObj } from "@storybook/react-vite";
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";

import { Toggle } from "@sycom/ui/components/toggle";

const meta = {
  title: "Simple/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  args: {
    defaultPressed: false,
    disabled: false,
    variant: "default" as const,
    size: "default" as const,
    children: "Toggle",
  },
  argTypes: {
    size: { control: "select", options: ["default", "sm", "lg"] },
    variant: { control: "select", options: ["default", "outline"] },
  },
} satisfies Meta<typeof Toggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Outline: Story = {
  args: { variant: "outline", children: "Outline" },
};

export const Disabled: Story = {
  args: { disabled: true, defaultPressed: true, children: "Off" },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Toggle defaultPressed>
        <BoldIcon /> Bold
      </Toggle>
      <Toggle defaultPressed={false} variant="outline">
        <ItalicIcon /> Italic
      </Toggle>
      <Toggle variant="outline">
        <UnderlineIcon /> Underline
      </Toggle>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Toggle size="sm" variant="outline">
        sm
      </Toggle>
      <Toggle size="default" variant="outline">
        default
      </Toggle>
      <Toggle size="lg" variant="outline">
        lg
      </Toggle>
    </div>
  ),
};
