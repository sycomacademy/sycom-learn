import type * as React from "react";
import { ImpersonationBanner } from "@/components/dashboard/admin/impersonation-banner";
import { shortcuts } from "@/lib/shortcuts/definitions";
import { Separator } from "@sycom/ui/components/separator";
import { SidebarInset, SidebarProvider } from "@sycom/ui/components/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

type DashboardShellProps = {
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function DashboardShell({
  children,
  defaultOpen = true,
}: DashboardShellProps): React.ReactElement {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      keyboardShortcut={{
        key: shortcuts.SIDEBAR_TOGGLE.key,
        ...shortcuts.SIDEBAR_TOGGLE.modifiers,
      }}
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
  );
}
