import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@sycom/ui/components/button";
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@sycom/ui/components/drawer";

const meta = {
  title: "Simple/Drawer",
  component: Drawer,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Drawer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <Drawer>
        <DrawerTrigger render={<Button variant="outline" />}>Open drawer</DrawerTrigger>
        <DrawerPopup showBar showCloseButton>
          <DrawerHeader>
            <DrawerTitle>Bottom drawer</DrawerTitle>
            <DrawerDescription>
              Default position is bottom with an optional drag bar.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerPanel>Scrollable panel content for longer copy or forms.</DrawerPanel>
          <DrawerFooter>
            <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
            <Button type="button">Submit</Button>
          </DrawerFooter>
        </DrawerPopup>
      </Drawer>
    </div>
  ),
};

export const RightSide: Story = {
  render: () => (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <Drawer position="right">
        <DrawerTrigger render={<Button variant="outline" />}>Open right drawer</DrawerTrigger>
        <DrawerPopup position="right" showCloseButton variant="inset">
          <DrawerHeader>
            <DrawerTitle>Details</DrawerTitle>
            <DrawerDescription>
              Edge sheet style with inset variant on larger screens.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerPanel>Content area</DrawerPanel>
          <DrawerFooter variant="bare">
            <DrawerClose render={<Button variant="secondary" />}>Done</DrawerClose>
          </DrawerFooter>
        </DrawerPopup>
      </Drawer>
    </div>
  ),
};

export const OpenByDefault: Story = {
  render: () => (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <Drawer defaultOpen position="bottom">
        <DrawerTrigger render={<Button variant="outline" />}>Open drawer</DrawerTrigger>
        <DrawerPopup showBar>
          <DrawerHeader>
            <DrawerTitle>Open by default</DrawerTitle>
            <DrawerDescription>Uses defaultOpen on the drawer root.</DrawerDescription>
          </DrawerHeader>
          <DrawerPanel>Visible immediately in Storybook.</DrawerPanel>
          <DrawerFooter>
            <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
          </DrawerFooter>
        </DrawerPopup>
      </Drawer>
    </div>
  ),
};
