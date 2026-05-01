import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import type { DateRange } from "react-day-picker";

import { DatePicker } from "@sycom/ui/components/date-picker";

const meta = {
  title: "Composite/DatePicker",
  component: DatePicker,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof DatePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Playground() {
    const [value, setValue] = React.useState<DateRange | undefined>({
      from: new Date(2026, 4, 1),
      to: new Date(2026, 4, 8),
    });

    return <DatePicker value={value} onValueChange={setValue} className="w-80" />;
  },
};

export const Empty: Story = {
  render: () => <DatePicker className="w-80" />,
};

export const CustomPlaceholder: Story = {
  render: () => <DatePicker className="w-80" placeholder="Select a reporting window" />,
};
