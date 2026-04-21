import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "@sycom/ui/components/calendar";
import { useState } from "react";

const meta = {
  title: "Simple/Calendar",
  component: Calendar,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Calendar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Playground() {
    const [selected, setSelected] = useState<Date | undefined>(new Date());

    return <Calendar mode="single" onSelect={setSelected} selected={selected} />;
  },
};

export const Uncontrolled: Story = {
  render: () => <Calendar mode="single" />,
};

export const Range: Story = {
  render: function Range() {
    const [range, setRange] = useState<{ from: Date | undefined; to?: Date | undefined }>({
      from: new Date(),
      to: undefined,
    });

    return (
      <Calendar
        defaultMonth={range.from}
        mode="range"
        numberOfMonths={2}
        onSelect={(next) => setRange(next ?? { from: undefined, to: undefined })}
        selected={range}
      />
    );
  },
};
