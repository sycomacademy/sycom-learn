import type { Meta, StoryObj } from "@storybook/react-vite";

import { RichTextEditorDemo } from "@sycom/ui/components/tiptap/rich-text-editor";

const meta = {
  title: "Composite/RichTextEditor (Tiptap)",
  component: RichTextEditorDemo,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof RichTextEditorDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Full demo: toolbar, floating menu, slash-style commands, and sample content including an image block. */
export const Playground: Story = {
  render: () => (
    <div className="w-full max-w-5xl">
      <RichTextEditorDemo className="rounded-lg border shadow-sm" />
    </div>
  ),
};
