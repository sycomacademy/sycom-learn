import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@sycom/ui/components/progress";

const meta = {
  title: "Simple/Progress",
  component: Progress,
  tags: ["autodocs"],
  args: {
    value: 40,
  },
} satisfies Meta<typeof Progress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { value: 40 },
  render: (args) => <Progress className="max-w-sm" value={args.value} />,
};

export const Indeterminate: Story = {
  render: () => <Progress className="max-w-sm" value={null} />,
};

export const WithLabel: Story = {
  render: () => (
    <Progress className="max-w-sm" value={65}>
      <div className="flex justify-between gap-2">
        <ProgressLabel>Uploading</ProgressLabel>
        <ProgressValue />
      </div>
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </Progress>
  ),
};

export const Stops: Story = {
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Progress value={0} />
      <Progress value={33} />
      <Progress value={66} />
      <Progress value={100} />
    </div>
  ),
};
