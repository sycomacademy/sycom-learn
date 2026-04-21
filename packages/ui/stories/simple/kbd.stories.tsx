import type { Meta, StoryObj } from "@storybook/react-vite";
import { CommandIcon, CornerDownLeftIcon } from "lucide-react";

import { Kbd, KbdGroup } from "@sycom/ui/components/kbd";

const meta = {
  title: "Simple/Kbd",
  component: Kbd,
  tags: ["autodocs"],
} satisfies Meta<typeof Kbd>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { children: "K" },
};

export const WithModifier: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  ),
};

export const SearchShortcut: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>⇧</Kbd>
      <Kbd>P</Kbd>
    </KbdGroup>
  ),
};

export const InSentence: Story = {
  render: () => (
    <p className="text-sm text-muted-foreground">
      Press <Kbd>?</Kbd> to open the shortcut palette, or <Kbd>Esc</Kbd> to close it.
    </p>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>
        <CommandIcon />
      </Kbd>
      <Kbd>
        <CornerDownLeftIcon />
      </Kbd>
    </KbdGroup>
  ),
};

export const Inline: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Kbd>Ctrl</Kbd>
      <Kbd>Alt</Kbd>
      <Kbd>Del</Kbd>
    </div>
  ),
};
