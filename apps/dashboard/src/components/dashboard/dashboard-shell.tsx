import type * as React from "react";
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
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset
        className="flex max-h-[calc(100vh-16px)] flex-col overflow-scroll border-x md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-0"
        role="main"
      >
        <DashboardHeader />
        <Separator aria-hidden="true" className="bg-secondary" />
        <div className="flex-1 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
