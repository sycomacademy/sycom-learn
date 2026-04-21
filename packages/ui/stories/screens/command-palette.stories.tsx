import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "../../src/components/button";
import { buttonVariants } from "../../src/components/button-variants";
import {
  Command,
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
  CommandSeparator,
  CommandShortcut,
} from "../../src/components/command";
import { cn } from "../../src/lib/utils";

function CommandPaletteScreen() {
  return (
    <div className="min-h-svh bg-background p-1">
      <div className="mx-auto flex min-h-svh max-w-3xl flex-col border-x border-dashed border-border/60">
        <header className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/32 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Acme App</p>
            <p className="text-xs text-muted-foreground">Press the button to open the palette.</p>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="hidden rounded-md border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground sm:inline">
              ⌘K
            </kbd>
            <CommandDialog defaultOpen>
              <CommandDialogTrigger
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-full max-w-56 min-w-48 justify-start gap-2 sm:w-56",
                )}
              >
                <Search className="size-4 opacity-64" />
                <span className="truncate text-muted-foreground/72">Search or jump to…</span>
                <span className="ms-auto text-[0.65rem] text-muted-foreground/64">Ctrl K</span>
              </CommandDialogTrigger>
              <CommandDialogPopup className="max-w-xl">
                <Command>
                  <CommandInput placeholder="Type a command or search the workspace…" />
                  <CommandPanel className="min-h-0">
                    <CommandList>
                      <CommandEmpty>No results match your search.</CommandEmpty>
                      <CommandGroup>
                        <CommandGroupLabel>Go to</CommandGroupLabel>
                        <CommandItem value="dashboard overview home">
                          <LayoutDashboard className="size-4 opacity-72" />
                          Dashboard
                          <CommandShortcut>⌘1</CommandShortcut>
                        </CommandItem>
                        <CommandItem value="inbox messages">
                          <FileText className="size-4 opacity-72" />
                          Inbox
                          <CommandShortcut>⌘2</CommandShortcut>
                        </CommandItem>
                        <CommandItem value="team people users">
                          <Users className="size-4 opacity-72" />
                          Team directory
                          <CommandShortcut>⌘3</CommandShortcut>
                        </CommandItem>
                      </CommandGroup>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandGroupLabel>Actions</CommandGroupLabel>
                        <CommandItem value="new project create start">
                          <Plus className="size-4 opacity-72" />
                          New project
                          <CommandShortcut>⌘N</CommandShortcut>
                        </CommandItem>
                        <CommandItem value="settings account preferences">
                          <Settings className="size-4 opacity-72" />
                          Open settings
                          <CommandShortcut>⌘,</CommandShortcut>
                        </CommandItem>
                        <CommandItem value="ai assistant help">
                          <Sparkles className="size-4 opacity-72" />
                          Ask the assistant
                          <CommandShortcut>⌘/</CommandShortcut>
                        </CommandItem>
                      </CommandGroup>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandGroupLabel>Support</CommandGroupLabel>
                        <CommandItem value="help docs guide">
                          <LifeBuoy className="size-4 opacity-72" />
                          View documentation
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </CommandPanel>
                  <CommandFooter>
                    <span>Navigate and select a destination or action</span>
                    <span className="ms-auto text-end">
                      <span className="whitespace-nowrap">↑↓ to move</span>
                      <span className="mx-1.5 text-border">·</span>
                      <span className="whitespace-nowrap">↵ to open</span>
                    </span>
                  </CommandFooter>
                </Command>
              </CommandDialogPopup>
            </CommandDialog>
          </div>
        </header>
        <div className="flex flex-1 items-start justify-center px-6 py-20">
          <div className="max-w-md space-y-2 text-center">
            <p className="text-sm font-medium text-foreground">Palette preview</p>
            <p className="text-sm text-muted-foreground">
              This screen is only for layout in Storybook. The command dialog opens above a minimal
              app chrome. Copy is placeholder text and does not run real navigation.
            </p>
            <div className="pt-2">
              <Button size="sm" variant="secondary">
                Secondary action
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: "Screens/Command palette",
  component: CommandPaletteScreen,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof CommandPaletteScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
