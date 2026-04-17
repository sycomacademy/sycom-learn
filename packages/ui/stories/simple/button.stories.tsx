import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRightIcon, PlusIcon, SendIcon } from "lucide-react";

import { Button } from "@sycom/ui/components/button";

const meta = {
  title: "Simple/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "Button",
    variant: "default",
    size: "default",
    loading: false,
    disabled: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "secondary", "ghost", "destructive", "link"],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Destructive: Story = {
  args: { variant: "destructive", children: "Delete" },
};

export const Outline: Story = {
  args: { variant: "outline", children: "Outline Button" },
};

export const Disabled: Story = {
  args: { disabled: true, children: "Disabled" },
};

export const WithIcon: Story = {
  args: {
    variant: "outline",
    children: (
      <>
        <SendIcon data-icon="inline-start" /> Send
      </>
    ),
  },
};

export const Loading: Story = {
  args: {
    variant: "outline",
    loading: true,
    children: "Please wait",
  },
};

export const IconEnd: Story = {
  args: {
    children: (
      <>
        Continue <ArrowRightIcon data-icon="inline-end" />
      </>
    ),
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(["xs", "sm", "default", "lg"] as const).map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-2">
          <Button size={size}>{size === "default" ? "Default" : size}</Button>
          <Button size={size} variant="outline">
            Outline
          </Button>
          <Button size={size} variant="ghost">
            Ghost
          </Button>
          <Button size={size} variant="destructive">
            Destructive
          </Button>
          <Button size={size} variant="secondary">
            Secondary
          </Button>
          <Button size={size} variant="link">
            Link
          </Button>
          <Button size={size} variant="outline">
            <SendIcon data-icon="inline-start" /> Send
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="icon-xs" variant="outline">
          <PlusIcon />
        </Button>
        <Button size="icon-sm" variant="outline">
          <PlusIcon />
        </Button>
        <Button size="icon" variant="outline">
          <PlusIcon />
        </Button>
        <Button size="icon-lg" variant="outline">
          <PlusIcon />
        </Button>
        <Button variant="outline">
          Learn More <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  ),
};
