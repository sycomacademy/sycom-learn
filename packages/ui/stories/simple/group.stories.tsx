import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchIcon } from "lucide-react";
import { Fragment } from "react";

import { Button } from "@sycom/ui/components/button";
import { Group, GroupSeparator, GroupText } from "@sycom/ui/components/group";
import { Input } from "@sycom/ui/components/input";

const baseArgs = {
  children: <Fragment />,
  orientation: "horizontal" as const,
};

const meta = {
  title: "Simple/Group",
  component: Group,
  tags: ["autodocs"],
  args: baseArgs,
  argTypes: {
    orientation: { control: "select", options: ["horizontal", "vertical"] },
  },
} satisfies Meta<typeof Group>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: baseArgs,
  render: (args) => (
    <Group {...args}>
      <GroupText>https://</GroupText>
      <Input
        className="min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none not-has-[[data-slot=input-control]:focus-within]:before:shadow-none"
        defaultValue="example.com"
        type="url"
        unstyled
      />
    </Group>
  ),
};

export const WithButton: Story = {
  args: baseArgs,
  render: (args) => (
    <Group {...args}>
      <Input
        className="min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none not-has-[[data-slot=input-control]:focus-within]:before:shadow-none"
        placeholder="Search…"
        type="search"
        unstyled
      />
      <GroupSeparator />
      <Button type="button" variant="secondary">
        <SearchIcon className="size-4" />
        Search
      </Button>
    </Group>
  ),
};

export const Vertical: Story = {
  args: { children: <Fragment />, orientation: "vertical" as const },
  render: (args) => (
    <Group className="w-full max-w-xs" {...args}>
      <GroupText>https://</GroupText>
      <Input
        className="min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none not-has-[[data-slot=input-control]:focus-within]:before:shadow-none"
        defaultValue="example.com"
        type="url"
        unstyled
      />
    </Group>
  ),
};

export const Chained: Story = {
  args: baseArgs,
  render: () => (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-0">
      <Group>
        <GroupText>Prefix</GroupText>
        <Input
          className="min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none not-has-[[data-slot=input-control]:focus-within]:before:shadow-none"
          defaultValue="one"
          unstyled
        />
      </Group>
      <Group>
        <GroupText>Suffix</GroupText>
        <Input
          className="min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none not-has-[[data-slot=input-control]:focus-within]:before:shadow-none"
          defaultValue="two"
          unstyled
        />
      </Group>
    </div>
  ),
};
