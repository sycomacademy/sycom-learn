import type { Meta, StoryObj } from "@storybook/react-vite";
import { FolderOpenIcon, InboxIcon } from "lucide-react";

import { Button } from "@sycom/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@sycom/ui/components/empty";

const meta = {
  title: "Simple/Empty",
  component: Empty,
  tags: ["autodocs"],
} satisfies Meta<typeof Empty>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Empty {...args} className="min-h-48 rounded-xl border">
      <EmptyHeader>
        <EmptyMedia>
          <InboxIcon className="text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>No messages</EmptyTitle>
        <EmptyDescription>Start a new conversation to see it appear here.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">New message</Button>
      </EmptyContent>
    </Empty>
  ),
};

export const IconMedia: Story = {
  render: () => (
    <Empty className="min-h-48 rounded-xl border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderOpenIcon className="text-foreground" />
        </EmptyMedia>
        <EmptyTitle>No files yet</EmptyTitle>
        <EmptyDescription>Drop files here or use import to get started.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" variant="outline">
          Import
        </Button>
      </EmptyContent>
    </Empty>
  ),
};

export const Minimal: Story = {
  render: () => (
    <Empty className="min-h-40 rounded-lg border-dashed">
      <EmptyHeader>
        <EmptyTitle>Nothing to show</EmptyTitle>
        <EmptyDescription>Adjust filters and try again.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};
