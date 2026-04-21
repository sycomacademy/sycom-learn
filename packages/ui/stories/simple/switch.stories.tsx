import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "@sycom/ui/components/label";
import { Switch } from "@sycom/ui/components/switch";

const meta = {
  title: "Simple/Switch",
  component: Switch,
  tags: ["autodocs"],
  args: {
    defaultChecked: false,
    disabled: false,
  },
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch defaultChecked id="sw-airplane" />
      <Label htmlFor="sw-airplane">Airplane mode</Label>
    </div>
  ),
};
