import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Meter,
  MeterIndicator,
  MeterLabel,
  MeterTrack,
  MeterValue,
} from "@sycom/ui/components/meter";

const meta = {
  title: "Simple/Meter",
  component: Meter,
  tags: ["autodocs"],
  args: {
    value: 55,
  },
} satisfies Meta<typeof Meter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { value: 55 },
  render: (args) => <Meter className="max-w-sm" value={args.value} />,
};

export const WithLabel: Story = {
  render: () => (
    <Meter className="max-w-sm" max={10} value={6}>
      <div className="flex justify-between gap-2">
        <MeterLabel>Seats in use</MeterLabel>
        <MeterValue />
      </div>
      <MeterTrack>
        <MeterIndicator />
      </MeterTrack>
    </Meter>
  ),
};

export const CustomRange: Story = {
  render: () => (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Meter max={4} value={1} />
      <Meter max={4} value={2} />
      <Meter max={4} value={3} />
      <Meter max={4} value={4} />
    </div>
  ),
};
