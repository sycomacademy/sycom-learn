import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "../../src/components/input";

const meta = {
  title: "Simple/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    placeholder: "Placeholder",
    type: "text",
    disabled: false,
  },
  argTypes: {
    type: {
      control: "select",
      options: [
        "text",
        "email",
        "password",
        "number",
        "tel",
        "url",
        "search",
        "date",
        "datetime-local",
        "month",
        "time",
        "week",
        "file",
      ],
    },
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Invalid: Story = {
  args: { "aria-invalid": true, placeholder: "Error" },
};

export const Disabled: Story = {
  args: { disabled: true, placeholder: "Disabled" },
};

export const AllTypes: Story = {
  render: () => (
    <div className="flex w-sm flex-col flex-wrap gap-4 md:flex-row">
      <Input placeholder="Email" type="email" />
      <Input aria-invalid placeholder="Error" />
      <Input placeholder="Password" type="password" />
      <Input placeholder="Number" type="number" />
      <Input placeholder="File" type="file" />
      <Input placeholder="Tel" type="tel" />
      <Input placeholder="Text" />
      <Input placeholder="URL" type="url" />
      <Input placeholder="Search" type="search" />
      <Input placeholder="Date" type="date" />
      <Input placeholder="Datetime Local" type="datetime-local" />
      <Input placeholder="Month" type="month" />
      <Input placeholder="Time" type="time" />
      <Input placeholder="Week" type="week" />
      <Input disabled placeholder="Disabled" />
    </div>
  ),
};
