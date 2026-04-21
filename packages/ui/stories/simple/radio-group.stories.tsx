import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "@sycom/ui/components/label";
import { Radio, RadioGroup } from "@sycom/ui/components/radio-group";

const meta = {
  title: "Simple/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
  args: {
    defaultValue: "comfortable",
    disabled: false,
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <RadioGroup {...args} className="max-w-sm">
      <div className="flex items-center gap-2">
        <Radio id="rg-default" value="default" />
        <Label htmlFor="rg-default">Default</Label>
      </div>
      <div className="flex items-center gap-2">
        <Radio id="rg-comfort" value="comfortable" />
        <Label htmlFor="rg-comfort">Comfortable</Label>
      </div>
      <div className="flex items-center gap-2">
        <Radio id="rg-compact" value="compact" />
        <Label htmlFor="rg-compact">Compact</Label>
      </div>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "comfortable" },
  render: (args) => (
    <RadioGroup {...args} className="max-w-sm">
      <div className="flex items-center gap-2">
        <Radio id="rg-d1" value="a" />
        <Label htmlFor="rg-d1">Option A</Label>
      </div>
      <div className="flex items-center gap-2">
        <Radio id="rg-d2" value="b" />
        <Label htmlFor="rg-d2">Option B</Label>
      </div>
    </RadioGroup>
  ),
};

export const Invalid: Story = {
  args: { defaultValue: "comfortable" },
  render: (args) => (
    <RadioGroup {...args} className="max-w-sm">
      <div className="flex items-center gap-2">
        <Radio aria-invalid id="rg-inv" value="comfortable" />
        <Label htmlFor="rg-inv">This group has an error state</Label>
      </div>
    </RadioGroup>
  ),
};
