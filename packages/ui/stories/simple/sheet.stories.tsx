import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@sycom/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
  SheetTrigger,
} from "@sycom/ui/components/sheet";

const meta = {
  title: "Simple/Sheet",
  component: Sheet,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Sheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>Open sheet</SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Sheet panel</SheetTitle>
            <SheetDescription>Slides in from the chosen side.</SheetDescription>
          </SheetHeader>
          <SheetPanel className="text-sm text-muted-foreground">
            Use the panel for scrollable regions when content grows.
          </SheetPanel>
          <SheetFooter>
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="button">Save</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  ),
};

export const LeftInset: Story = {
  render: () => (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>Open left sheet</SheetTrigger>
        <SheetContent side="left" variant="inset">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Inset variant adds padding on wide viewports.</SheetDescription>
          </SheetHeader>
          <SheetPanel>Links or filters can live here.</SheetPanel>
        </SheetContent>
      </Sheet>
    </div>
  ),
};

export const OpenByDefault: Story = {
  render: () => (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <Sheet defaultOpen>
        <SheetTrigger render={<Button variant="outline" />}>Open sheet</SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Initially open</SheetTitle>
            <SheetDescription>Helpful for capturing the sheet chrome in docs.</SheetDescription>
          </SheetHeader>
          <SheetPanel>Content</SheetPanel>
        </SheetContent>
      </Sheet>
    </div>
  ),
};
