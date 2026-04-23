"use client";

import * as React from "react";
import { useRouterState } from "@tanstack/react-router";
import { LayoutDashboardIcon } from "@sycom/ui/components/animated/icons/layout-dashboard";
import { SettingsIcon } from "@sycom/ui/components/animated/icons/settings";
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
} from "@sycom/ui/components/sidebar";
import { Link } from "@/components/layout/foresight-link";
import type { TRoutes } from "@/router";
import { cn } from "@sycom/ui/lib/utils";
import { AnimateIcon, type IconProps } from "@sycom/ui/components/animated/icons/icon";

type NavIcon = React.ComponentType<IconProps<never>>;

type NavItem = {
  icon: NavIcon;
  label: string;
  to: TRoutes;
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
      { icon: SettingsIcon, label: "Settings", to: "/dashboard/settings" },
    ],
  },
];

/**
 * Expanded: h-12 row, base p-2 (icon at 16px from rail-left).
 * Collapsed: 48x48 square, p-3, with -3px negative side margins so the button sits dead-center in the
 * 58px rail (icon ends up at 17px — only 1px of total drift over the entire 240ms collapse).
 *
 * Crucially, all three deltas (width: full→48, padding: 8→12, margin: 0→-3) animate together on the
 * SAME duration/easing as the sidebar itself — so spatial consistency holds throughout the motion
 * instead of snapping at the start.
 */
const menuButtonStableClass = cn(
  "h-12",
  "transition-[width,height,padding,margin] duration-240 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
  "group-data-[collapsible=icon]:!size-12",
  "group-data-[collapsible=icon]:!p-3",
  "group-data-[collapsible=icon]:!-mx-[3px]",
);

/**
 * Match the label's exit to the sidebar's collapse motion (240ms + iOS curve) so the label finishes
 * fading exactly when the rail finishes narrowing — no orphan "icon centered in still-expanding rail"
 * frame. Per Emil: spatial consistency + cohesion of easing/duration with the rest of the motion.
 */
const menuButtonLabelFadeClass = cn(
  "[&>span:last-child]:!duration-240",
  "[&>span:last-child]:!ease-[cubic-bezier(0.32,0.72,0,1)]",
  "group-data-[collapsible=icon]:[&>span:last-child]:opacity-0",
);

/** Cancel -mt-8 slide; keep label row height so nav items do not jump vertically. */
const groupLabelStableClass = cn(
  "group-data-[collapsible=icon]:mt-0",
  "group-data-[collapsible=icon]:opacity-0",
  "group-data-[collapsible=icon]:pointer-events-none",
);

export function AppSidebar(): React.ReactElement {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const activeTo = React.useMemo(() => {
    let bestMatch: TRoutes | undefined;
    let bestLength = -1;
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        const matches = pathname === item.to || pathname.startsWith(`${item.to}/`);
        if (matches && item.to.length > bestLength) {
          bestMatch = item.to;
          bestLength = item.to.length;
        }
      }
    }
    return bestMatch;
  }, [pathname]);

  return (
    <Sidebar className="border-sidebar-border" collapsible="icon" variant="inset">
      <SidebarHeader>
        <Link
          className="flex items-center gap-2 text-sm font-semibold text-sidebar-foreground"
          href="/dashboard"
        >
          <img
            alt="Sycom Solutions logo"
            className="h-10 w-auto"
            height={40}
            src="/logos/logo.jpg"
            width={160}
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className={groupLabelStableClass}>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(({ to, label, icon: Icon }) => {
                  return (
                    <SidebarMenuItem key={label}>
                      <AnimateIcon animateOnHover>
                        <SidebarMenuButton
                          className={cn(menuButtonStableClass, menuButtonLabelFadeClass)}
                          isActive={activeTo === to}
                          render={<Link to={to} />}
                          tooltip={label}
                          size="lg"
                        >
                          <Icon className="size-6" />
                          <span>{label}</span>
                        </SidebarMenuButton>
                      </AnimateIcon>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
