import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button } from "@sycom/ui/components/button";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
} from "@sycom/ui/components/menu";

const meta = {
  title: "Simple/Menu",
  component: Menu,
  tags: ["autodocs"],
} satisfies Meta<typeof Menu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>Open menu</MenuTrigger>
      <MenuPopup>
        <MenuGroup>
          <MenuGroupLabel>Account</MenuGroupLabel>
          <MenuItem>
            Profile
            <MenuShortcut>⇧⌘P</MenuShortcut>
          </MenuItem>
          <MenuItem inset>Settings</MenuItem>
          <MenuSeparator />
          <MenuItem variant="destructive">Sign out</MenuItem>
        </MenuGroup>
      </MenuPopup>
    </Menu>
  ),
};

export const WithSubmenuAndSelection: Story = {
  render: function WithSubmenuAndSelectionStory() {
    const [notifications, setNotifications] = useState(true);
    const [theme, setTheme] = useState("system");

    return (
      <Menu>
        <MenuTrigger render={<Button variant="outline" />}>Options</MenuTrigger>
        <MenuPopup className="w-56">
          <MenuGroup>
            <MenuGroupLabel>Appearance</MenuGroupLabel>
            <MenuSub>
              <MenuSubTrigger inset>Theme</MenuSubTrigger>
              <MenuSubPopup>
                <MenuRadioGroup onValueChange={setTheme} value={theme}>
                  <MenuRadioItem value="light">Light</MenuRadioItem>
                  <MenuRadioItem value="dark">Dark</MenuRadioItem>
                  <MenuRadioItem value="system">System</MenuRadioItem>
                </MenuRadioGroup>
              </MenuSubPopup>
            </MenuSub>
            <MenuCheckboxItem
              checked={notifications}
              onCheckedChange={(v) => setNotifications(Boolean(v))}
            >
              Notifications
            </MenuCheckboxItem>
            <MenuCheckboxItem defaultChecked variant="switch">
              Compact mode
            </MenuCheckboxItem>
          </MenuGroup>
        </MenuPopup>
      </Menu>
    );
  },
};

export const OpenByDefault: Story = {
  render: () => (
    <Menu defaultOpen>
      <MenuTrigger render={<Button variant="outline" />}>Menu</MenuTrigger>
      <MenuPopup>
        <MenuItem>First action</MenuItem>
        <MenuItem>Second action</MenuItem>
      </MenuPopup>
    </Menu>
  ),
};
