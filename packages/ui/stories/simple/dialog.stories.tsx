import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@sycom/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from "@sycom/ui/components/dialog";

const meta = {
  title: "Simple/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>Open dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Make changes here. Click save when you are done.</DialogDescription>
          </DialogHeader>
          <DialogPanel className="text-sm text-muted-foreground">
            Dialog body content goes in the scrollable panel.
          </DialogPanel>
          <DialogFooter>
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="button">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ),
};

export const OpenByDefault: Story = {
  render: () => (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>Open dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initially open</DialogTitle>
            <DialogDescription>
              This story uses <code className="rounded bg-muted px-1">defaultOpen</code> so the
              modal renders expanded in Storybook.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>Panel content is visible without clicking the trigger.</DialogPanel>
          <DialogFooter variant="bare">
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ),
};
