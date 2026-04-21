import type { Meta, StoryObj } from "@storybook/react-vite";
import { MailIcon, SparklesIcon } from "lucide-react";

import { Badge } from "@sycom/ui/components/badge";

const meta = {
  title: "Simple/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: {
    children: "Badge",
    variant: "default",
    size: "default",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
    },
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "destructive",
        "outline",
        "error",
        "info",
        "success",
        "warning",
      ],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <SparklesIcon /> New
      </>
    ),
    variant: "secondary",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-2">
      <Badge size="sm" variant="outline">
        Small
      </Badge>
      <Badge size="default" variant="outline">
        Default
      </Badge>
      <Badge size="lg" variant="outline">
        Large
      </Badge>
    </div>
  ),
};

export const IconBadge: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>
        <MailIcon /> 3
      </Badge>
      <Badge variant="secondary">
        <SparklesIcon /> Pro
      </Badge>
    </div>
  ),
};
