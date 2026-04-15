import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "../../src/components/checkbox";
import { Input } from "../../src/components/input";
import { Label } from "../../src/components/label";

const meta = {
  title: "Simple/Label",
  component: Label,
  tags: ["autodocs"],
  args: {
    children: "Label",
  },
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Examples: Story = {
  render: () => (
    <div className="grid w-sm gap-6">
      <div className="flex items-center gap-3">
        <Checkbox id="label-terms" />
        <Label htmlFor="label-terms">Accept terms and conditions</Label>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="label-username">Username</Label>
        <Input id="label-username" placeholder="Username" />
      </div>
      <div className="group grid gap-2" data-disabled="true">
        <Label htmlFor="label-disabled">Disabled</Label>
        <Input disabled id="label-disabled" placeholder="Disabled" />
      </div>
    </div>
  ),
};
