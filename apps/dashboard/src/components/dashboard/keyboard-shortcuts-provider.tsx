"use client";

import * as React from "react";
import { KeyboardShortcutsDialog } from "@/components/dashboard/keyboard-shortcuts-dialog";
import { useGlobalShortcuts } from "@/hooks/use-global-shortcuts";
import { createShortcutBindings } from "@/lib/shortcuts/bindings";

type KeyboardShortcutsContextValue = {
  openShortcutsDialog: () => void;
};

const KeyboardShortcutsContext = React.createContext<KeyboardShortcutsContextValue | null>(null);

export function useKeyboardShortcutsDialog(): KeyboardShortcutsContextValue {
  const context = React.useContext(KeyboardShortcutsContext);

  if (!context) {
    throw new Error("useKeyboardShortcutsDialog must be used within KeyboardShortcutsProvider.");
  }

  return context;
}

type KeyboardShortcutsProviderProps = {
  children: React.ReactNode;
};

export function KeyboardShortcutsProvider({
  children,
}: KeyboardShortcutsProviderProps): React.ReactElement {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const openShortcutsDialog = React.useCallback(() => {
    setDialogOpen(true);
  }, []);

  const contextValue = React.useMemo<KeyboardShortcutsContextValue>(
    () => ({ openShortcutsDialog }),
    [openShortcutsDialog],
  );

  useGlobalShortcuts(
    createShortcutBindings({
      OPEN_SHORTCUTS_HELP: () => setDialogOpen(true),
    }),
  );

  return (
    <KeyboardShortcutsContext.Provider value={contextValue}>
      {children}
      <KeyboardShortcutsDialog onOpenChange={setDialogOpen} open={dialogOpen} />
    </KeyboardShortcutsContext.Provider>
  );
}
