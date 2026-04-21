import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@sycom/ui/components/button";
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
} from "@sycom/ui/components/preview-card";

const meta = {
  title: "Simple/PreviewCard",
  component: PreviewCard,
  tags: ["autodocs"],
} satisfies Meta<typeof PreviewCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <PreviewCard>
      <PreviewCardTrigger delay={200} render={<Button variant="outline" />}>
        Hover for preview
      </PreviewCardTrigger>
      <PreviewCardPopup>
        <p className="font-medium text-foreground">PreviewCard</p>
        <p className="mt-1 text-muted-foreground">
          Base UI preview card: hover or focus the trigger to show anchored content.
        </p>
      </PreviewCardPopup>
    </PreviewCard>
  ),
};

export const OpenByDefault: Story = {
  render: () => (
    <PreviewCard defaultOpen>
      <PreviewCardTrigger delay={0} render={<Button variant="secondary" />}>
        Trigger (preview starts open)
      </PreviewCardTrigger>
      <PreviewCardPopup>
        <p className="text-sm">
          Useful in docs to show the popup without hovering. Close by moving away or Escape.
        </p>
      </PreviewCardPopup>
    </PreviewCard>
  ),
};
