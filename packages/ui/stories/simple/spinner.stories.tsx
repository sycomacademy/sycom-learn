import type { Meta, StoryObj } from "@storybook/react-vite";

import { Spinner } from "@sycom/ui/components/spinner";

const meta = {
  title: "Simple/Spinner",
  component: Spinner,
  tags: ["autodocs"],
  args: {
    className: "size-4",
  },
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4 text-muted-foreground">
      <Spinner className="size-3" />
      <Spinner className="size-4" />
      <Spinner className="size-6" />
      <Spinner className="size-8" />
    </div>
  ),
};

export const InButton: Story = {
  render: () => (
    <div className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
      <Spinner className="size-3.5" />
      Loading…
    </div>
  ),
};
