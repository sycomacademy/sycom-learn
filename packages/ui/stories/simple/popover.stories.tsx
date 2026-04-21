import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@sycom/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@sycom/ui/components/popover";

const meta = {
  title: "Simple/Popover",
  component: Popover,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Open popover</PopoverTrigger>
      <PopoverContent className="w-80">
        <PopoverTitle>Dimensions</PopoverTitle>
        <PopoverDescription>Set the width and height for the layer.</PopoverDescription>
        <p className="mt-2 text-sm text-muted-foreground">
          Popover content is portaled and positioned relative to the trigger.
        </p>
      </PopoverContent>
    </Popover>
  ),
};

export const TooltipStyle: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="sm" />}>Compact</PopoverTrigger>
      <PopoverContent tooltipStyle className="max-w-xs">
        Short hint styled like a tooltip via{" "}
        <code className="rounded bg-muted/80 px-1">tooltipStyle</code>.
      </PopoverContent>
    </Popover>
  ),
};

export const OpenByDefault: Story = {
  render: () => (
    <Popover defaultOpen>
      <PopoverTrigger render={<Button variant="outline" />}>Open popover</PopoverTrigger>
      <PopoverContent>
        <PopoverTitle>Open by default</PopoverTitle>
        <PopoverDescription>Uses defaultOpen on the popover root.</PopoverDescription>
      </PopoverContent>
    </Popover>
  ),
};
