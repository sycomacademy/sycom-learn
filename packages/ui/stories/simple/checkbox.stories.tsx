import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "../../src/components/checkbox";
import { Label } from "../../src/components/label";

const meta = {
  title: "Simple/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  args: {
    defaultChecked: false,
    disabled: false,
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Examples: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Checkbox id="cb-terms" />
        <Label htmlFor="cb-terms">Accept terms and conditions</Label>
      </div>
      <div className="flex items-start gap-3">
        <Checkbox defaultChecked id="cb-terms-2" />
        <div className="grid gap-1">
          <Label htmlFor="cb-terms-2">Accept terms and conditions</Label>
          <p className="text-xs text-muted-foreground">
            By clicking this checkbox, you agree to the terms and conditions.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Checkbox disabled id="cb-disabled" />
        <Label htmlFor="cb-disabled">Enable notifications</Label>
      </div>
    </div>
  ),
};
