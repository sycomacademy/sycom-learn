"use client";

import * as React from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  BlocksIcon,
  LayoutDashboardIcon,
  MessageCircleQuestionIcon,
  SettingsIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@sycom/ui/components/sidebar";
import { Link } from "@/components/layout/foresight-link";

type NavItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to: "/dashboard" | "/settings" | "/";
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [
      { icon: LayoutDashboardIcon, label: "Overview", to: "/dashboard" },
      { icon: BlocksIcon, label: "Home", to: "/" },
    ],
  },
  {
    label: "General",
    items: [
      { icon: SettingsIcon, label: "Settings", to: "/settings" },
      { icon: MessageCircleQuestionIcon, label: "Support", to: "/" },
    ],
  },
];

export function DashboardSidebar(): React.ReactElement {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isActiveRoute = React.useCallback(
    (to: NavItem["to"]) => {
      if (to === "/") {
        return pathname === "/";
      }
      return pathname === to || pathname.startsWith(`${to}/`);
    },
    [pathname],
  );

  return (
    <Sidebar className="border-sidebar-border" collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/dashboard" />}>
              <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <LayoutDashboardIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Sycom</span>
                <span className="truncate text-xs">Dashboard</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      className="[&_svg]:size-5"
                      isActive={isActiveRoute(item.to)}
                      render={<Link to={item.to} />}
                      size="lg"
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
