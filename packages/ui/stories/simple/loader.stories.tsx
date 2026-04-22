import type { Meta, StoryObj } from "@storybook/react-vite";

import { Loader } from "@sycom/ui/components/loader";

const meta = {
  title: "Simple/Loader",
  component: Loader,
  tags: ["autodocs"],
} satisfies Meta<typeof Loader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <div className="h-48 w-full max-w-md rounded-lg border">
      <Loader />
    </div>
  ),
};

export const TallFrame: Story = {
  render: () => (
    <div className="h-96 w-full max-w-2xl rounded-lg border">
      <Loader />
    </div>
  ),
};
