import type { Meta, StoryObj } from "@storybook/react-vite";

import { Textarea } from "@sycom/ui/components/textarea";

const meta = {
  title: "Simple/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: {
    disabled: false,
    placeholder: "Type something…",
    rows: 4,
    "aria-invalid": false,
  },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Invalid: Story = {
  args: { "aria-invalid": true, placeholder: "This field has an error" },
};

export const Disabled: Story = {
  args: { disabled: true, placeholder: "Disabled" },
};

export const Sizes: Story = {
  render: () => (
    <div className="grid w-sm gap-3">
      <Textarea placeholder="Small" rows={3} size="sm" />
      <Textarea placeholder="Default" rows={3} size="default" />
      <Textarea placeholder="Large" rows={3} size="lg" />
    </div>
  ),
};

export const Unstyled: Story = {
  args: { unstyled: true, className: "w-full min-h-24 rounded border border-dashed p-2" },
};
