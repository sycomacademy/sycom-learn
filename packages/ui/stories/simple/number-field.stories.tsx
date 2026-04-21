import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldScrubArea,
} from "@sycom/ui/components/number-field";

const meta = {
  title: "Simple/NumberField",
  component: NumberField,
  tags: ["autodocs"],
  args: {
    defaultValue: 3,
    min: 0,
    max: 10,
    step: 1,
    disabled: false,
    size: "default" as const,
  },
  render: (args) => (
    <NumberField {...args}>
      <NumberFieldGroup>
        <NumberFieldDecrement />
        <NumberFieldInput />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  ),
} satisfies Meta<typeof NumberField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

export const WithScrubArea: Story = {
  args: { defaultValue: 10, min: 0, max: 100, step: 0.1 },
  render: (args) => (
    <NumberField {...args}>
      <NumberFieldScrubArea label="Drag horizontally to scrub" />
      <NumberFieldGroup>
        <NumberFieldDecrement />
        <NumberFieldInput />
        <NumberFieldIncrement />
      </NumberFieldGroup>
    </NumberField>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex w-sm flex-col gap-6">
      {(["sm", "default", "lg"] as const).map((size) => (
        <NumberField defaultValue={2} key={size} max={5} min={0} size={size}>
          <NumberFieldGroup>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldGroup>
        </NumberField>
      ))}
    </div>
  ),
};
