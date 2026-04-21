import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDownIcon } from "lucide-react";

import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@sycom/ui/components/collapsible";

const meta = {
  title: "Simple/Collapsible",
  component: Collapsible,
  tags: ["autodocs"],
} satisfies Meta<typeof Collapsible>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Collapsible {...args} className="w-full max-w-sm rounded-lg border p-3">
      <CollapsibleTrigger className="group flex w-full items-center justify-between text-left text-sm font-medium">
        Advanced options
        <ChevronDownIcon className="size-4 opacity-80 transition group-data-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsiblePanel className="pt-2 text-sm text-muted-foreground">
        Use these when you need more control over the export format or target environment.
      </CollapsiblePanel>
    </Collapsible>
  ),
};

export const Uncontrolled: Story = {
  render: () => (
    <Collapsible className="w-full max-w-sm rounded-md border p-3" defaultOpen>
      <CollapsibleTrigger className="w-full text-left text-sm font-medium">
        Toggle body
      </CollapsibleTrigger>
      <CollapsiblePanel className="pt-2 text-sm text-muted-foreground">
        Extra information appears here when the panel is open.
      </CollapsiblePanel>
    </Collapsible>
  ),
};
