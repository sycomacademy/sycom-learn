import type * as React from "react";

import { ImpersonationBanner } from "@/components/dashboard/admin/impersonation-banner";
import { KeyboardShortcutsProvider } from "@/components/dashboard/keyboard-shortcuts-provider";
import { shortcuts } from "@/lib/shortcuts/definitions";
import { useOrgWorkspaceThemeStyle } from "@/lib/org-workspace-theme";
import { Separator } from "@sycom/ui/components/separator";
import { SidebarInset, SidebarProvider } from "@sycom/ui/components/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export type DashboardChromeProps = {
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function DashboardChrome({
  children,
  defaultOpen = true,
}: DashboardChromeProps): React.ReactElement {
  const accentStyle = useOrgWorkspaceThemeStyle();

  return (
    <KeyboardShortcutsProvider>
      <SidebarProvider
        defaultOpen={defaultOpen}
        keyboardShortcut={{
          key: shortcuts.SIDEBAR_TOGGLE.key,
          ...shortcuts.SIDEBAR_TOGGLE.modifiers,
        }}
        style={accentStyle}
      >
        <AppSidebar />
        <SidebarInset
          className="flex max-h-[calc(100vh-16px)] flex-col overflow-scroll border-x md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-0"
          role="main"
        >
          <ImpersonationBanner />
          <DashboardHeader />
          <Separator aria-hidden="true" className="bg-secondary" />
          <div className="flex-1 p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </KeyboardShortcutsProvider>
  );
}
