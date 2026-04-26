import type { Meta, StoryObj } from "@storybook/react-vite";

import { Loader } from "@sycom/ui/components/loader";

const meta = {
  title: "Simple/Loader",
  component: Loader,
  tags: ["autodocs"],
  args: {
    mode: "container",
    text: "Loading",
  },
} satisfies Meta<typeof Loader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="h-48 w-full max-w-md rounded-lg border">
      <Loader {...args} />
    </div>
  ),
};

export const DashboardContainer: Story = {
  render: () => (
    <div className="h-96 w-full max-w-2xl rounded-lg border">
      <Loader mode="container" text="Loading workspace" />
    </div>
  ),
};

export const Fullscreen: Story = {
  args: {
    mode: "screen",
    text: "Loading",
  },
  parameters: {
    layout: "fullscreen",
  },
};
