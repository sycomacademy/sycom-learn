import type { Meta, StoryObj } from "@storybook/react-vite";

import { ScrollArea } from "@sycom/ui/components/scroll-area";

const paragraphs = Array.from({ length: 12 }, (_, i) => (
  <p key={i} className="text-sm leading-relaxed text-muted-foreground">
    Paragraph {i + 1}. Scroll the viewport to see custom scrollbars and overflow behavior.
  </p>
));

const meta = {
  title: "Simple/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
} satisfies Meta<typeof ScrollArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <ScrollArea className="h-48 w-72 rounded-lg border p-4">
      <div className="flex flex-col gap-3 pr-2">{paragraphs}</div>
    </ScrollArea>
  ),
};

export const ScrollFadeAndGutter: Story = {
  render: () => (
    <ScrollArea className="h-48 w-72 rounded-lg border p-4" scrollFade scrollbarGutter>
      <div className="flex flex-col gap-3">{paragraphs}</div>
    </ScrollArea>
  ),
};

export const HorizontalOverflow: Story = {
  render: () => (
    <ScrollArea className="h-24 w-64 rounded-lg border p-3" scrollbarGutter>
      <div className="flex w-[200%] gap-2">
        {["One", "Two", "Three", "Four", "Five"].map((label) => (
          <div
            key={label}
            className="shrink-0 rounded-md border bg-muted/40 px-4 py-2 text-sm whitespace-nowrap"
          >
            {label}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};
