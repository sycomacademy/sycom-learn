"use client";

import { SidebarTrigger } from "@sycom/ui/components/sidebar";
import { DashboardUserMenu } from "@/components/layout/dashboard-user-menu";

export function DashboardHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/70">
      <SidebarTrigger />
      <div className="flex items-center gap-2">
        <DashboardUserMenu />
      </div>
    </header>
  );
}
