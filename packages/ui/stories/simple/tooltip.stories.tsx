import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@sycom/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@sycom/ui/components/tooltip";

const meta = {
  title: "Simple/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>Hover or focus</TooltipTrigger>
      <TooltipContent>
        <p>Contextual help appears on hover or keyboard focus.</p>
      </TooltipContent>
    </Tooltip>
  ),
};

export const Placement: Story = {
  render: () => (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {(["top", "bottom", "left", "right"] as const).map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger render={<Button variant="outline" size="sm" />}>{side}</TooltipTrigger>
          <TooltipContent side={side}>
            <p>Side: {side}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
};

export const OpenByDefault: Story = {
  render: () => (
    <Tooltip defaultOpen>
      <TooltipTrigger render={<Button variant="outline" />}>Pinned open</TooltipTrigger>
      <TooltipContent>
        <p>Uses defaultOpen for documentation snapshots.</p>
      </TooltipContent>
    </Tooltip>
  ),
};
