import type { Meta, StoryObj } from "@storybook/react-vite";

import { QRCode } from "@sycom/ui/components/qr-code";

const meta = {
  title: "Simple/QRCode",
  component: QRCode,
  tags: ["autodocs"],
  args: {
    className: "size-40",
    data: "otpauth://totp/Sycom:asa@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Sycom",
    robustness: "M",
  },
  argTypes: {
    robustness: {
      control: "select",
      options: ["L", "M", "Q", "H"],
    },
  },
} satisfies Meta<typeof QRCode>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ThemedCard: Story = {
  render: (args) => (
    <div className="w-fit rounded-md border bg-card p-4">
      <QRCode {...args} className="size-44" />
    </div>
  ),
};

export const HighContrast: Story = {
  args: {
    foreground: "#111827",
    background: "#f9fafb",
    robustness: "H",
  },
};
