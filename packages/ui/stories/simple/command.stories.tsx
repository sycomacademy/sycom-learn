import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@sycom/ui/components/button";
import {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandDialogTrigger,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandShortcut,
} from "@sycom/ui/components/command";

const actions = [
  { value: "profile", label: "Profile", shortcut: "⌘P" },
  { value: "settings", label: "Settings", shortcut: "⌘," },
  { value: "logout", label: "Sign out", shortcut: "⇧⌘Q" },
] as const;

const dialogActions = [
  ...actions,
  { value: "help", label: "Help", shortcut: "?" },
  { value: "docs", label: "Documentation", shortcut: "⌘D" },
] as const;

type Action = (typeof actions)[number];
type DialogAction = (typeof dialogActions)[number];

const meta = {
  title: "Simple/Command",
  component: Command,
  tags: ["autodocs"],
} satisfies Meta<typeof Command>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InlinePalette: Story = {
  render: () => (
    <div className="w-full max-w-xl rounded-2xl border bg-background p-1 shadow-sm">
      <Command items={actions}>
        <CommandInput placeholder="Search actions…" />
        <CommandPanel className="border-0 shadow-none">
          <CommandEmpty>No results.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              <CommandGroupLabel>Account</CommandGroupLabel>
              <CommandCollection>
                {(item: Action) => (
                  <CommandItem key={item.value} value={item}>
                    {item.label}
                    <CommandShortcut>{item.shortcut}</CommandShortcut>
                  </CommandItem>
                )}
              </CommandCollection>
            </CommandGroup>
          </CommandList>
        </CommandPanel>
        <CommandFooter>↑↓ navigate · ↵ select · esc close</CommandFooter>
      </Command>
    </div>
  ),
};

export const CommandDialogStory: Story = {
  name: "Command dialog",
  render: () => (
    <div className="flex min-h-[40vh] items-center justify-center p-8">
      <CommandDialog>
        <CommandDialogTrigger render={<Button variant="outline" />}>
          Open command palette
        </CommandDialogTrigger>
        <CommandDialogPopup>
          <Command items={dialogActions}>
            <CommandInput placeholder="Search…" />
            <CommandPanel>
              <CommandEmpty>No results.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  <CommandGroupLabel>Actions</CommandGroupLabel>
                  <CommandCollection>
                    {(item: DialogAction) => (
                      <CommandItem key={item.value} value={item}>
                        {item.label}
                        <CommandShortcut>{item.shortcut}</CommandShortcut>
                      </CommandItem>
                    )}
                  </CommandCollection>
                </CommandGroup>
              </CommandList>
            </CommandPanel>
            <CommandFooter>Type to filter · Enter to run</CommandFooter>
          </Command>
        </CommandDialogPopup>
      </CommandDialog>
    </div>
  ),
};
