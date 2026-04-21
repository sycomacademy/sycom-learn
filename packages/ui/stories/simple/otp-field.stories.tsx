import type { Meta, StoryObj } from "@storybook/react-vite";

import { OTPField, OTPFieldInput, OTPFieldSeparator } from "@sycom/ui/components/otp-field";

const meta = {
  title: "Simple/OTPField",
  component: OTPField,
  tags: ["autodocs"],
  args: {
    length: 6,
    disabled: false,
    size: "default" as const,
  },
  render: (args) => (
    <OTPField {...args}>
      {Array.from({ length: args.length }, (_, i) => (
        <OTPFieldInput key={i} />
      ))}
    </OTPField>
  ),
} satisfies Meta<typeof OTPField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithSeparator: Story = {
  args: { length: 6, size: "default" as const },
  render: (args) => (
    <OTPField {...args}>
      <OTPFieldInput />
      <OTPFieldInput />
      <OTPFieldInput />
      <OTPFieldSeparator />
      <OTPFieldInput />
      <OTPFieldInput />
      <OTPFieldInput />
    </OTPField>
  ),
};

export const Large: Story = {
  args: { length: 4, size: "lg" as const, disabled: false },
  render: (args) => (
    <OTPField {...args}>
      {Array.from({ length: args.length }, (_, i) => (
        <OTPFieldInput key={i} />
      ))}
    </OTPField>
  ),
};

export const Disabled: Story = {
  args: { length: 4, disabled: true },
  render: (args) => (
    <OTPField {...args}>
      {Array.from({ length: args.length }, (_, i) => (
        <OTPFieldInput key={i} />
      ))}
    </OTPField>
  ),
};

export const Invalid: Story = {
  args: { length: 4 },
  render: (args) => (
    <OTPField {...args} aria-invalid>
      {Array.from({ length: args.length }, (_, i) => (
        <OTPFieldInput key={i} />
      ))}
    </OTPField>
  ),
};
