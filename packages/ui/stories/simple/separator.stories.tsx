import type { Meta, StoryObj } from "@storybook/react-vite";

import { Separator } from "@sycom/ui/components/separator";

const meta = {
  title: "Simple/Separator",
  component: Separator,
  tags: ["autodocs"],
  args: {
    orientation: "horizontal",
  },
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="w-full max-w-sm">
      <p className="text-sm">Section A</p>
      <Separator {...args} className="my-3" />
      <p className="text-sm">Section B</p>
    </div>
  ),
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <div className="flex h-8 items-stretch">
      <span className="text-sm">Left</span>
      <Separator {...args} className="mx-3" />
      <span className="text-sm">Right</span>
    </div>
  ),
};

export const InList: Story = {
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-1 text-sm">
      <div>Item one</div>
      <Separator />
      <div>Item two</div>
      <Separator />
      <div>Item three</div>
    </div>
  ),
};
