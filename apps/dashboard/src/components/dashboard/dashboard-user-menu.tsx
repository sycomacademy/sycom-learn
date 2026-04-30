"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { LogOutIcon } from "@sycom/ui/components/animated/icons/log-out";
import { Avatar, AvatarFallback, AvatarImage } from "@sycom/ui/components/avatar";
import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@sycom/ui/components/dropdown-menu";
import { toastManager } from "@sycom/ui/components/toast";
import { useGlobalShortcuts } from "@/hooks/use-global-shortcuts";
import { useUser } from "@/hooks/use-user";
import { authClient } from "@/lib/auth/auth-client";
import { createShortcutBindings } from "@/lib/shortcuts/bindings";
import { shortcutIds } from "@/lib/shortcuts/definitions";
import { getShortcutLabelById } from "@/lib/shortcuts/format";
import { buildImageUrl } from "@sycom/ui/image/cdn";
import { getInitials, snakeCaseToTitleCase } from "@sycom/ui/lib/string";
import { Facehash } from "facehash";
import { AnimateIcon } from "@sycom/ui/components/animated/icons/icon";
import { KeyboardShortcutsIcon } from "@sycom/ui/components/animated/icons/keyboard-shortcuts";
import { MessageCircleQuestionIcon } from "@sycom/ui/components/animated/icons/message-circle-question";
import { SettingsIcon } from "@sycom/ui/components/animated/icons/settings";
import { ThemeToggleIcon } from "@sycom/ui/components/animated/icons/theme-toggle";
import { useTheme } from "next-themes";
import type { UserRole } from "@sycom/db/schema/auth";
import { useKeyboardShortcutsDialog } from "@/components/dashboard/keyboard-shortcuts-provider";

export function DashboardUserMenu(): React.ReactElement {
  const { openShortcutsDialog } = useKeyboardShortcutsDialog();
  const {
    data: { user, profile },
  } = useUser();
  const userRole = user.role as UserRole;
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const enableFacehash = profile.settings?.enableFacehash;

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      const { error } = await authClient.signOut();
      if (error) {
        toastManager.add({ title: error.message, type: "error" });
        return;
      }

      await queryClient.cancelQueries();
      queryClient.clear();

      toastManager.add({ title: "Signed out", type: "success" });

      await router.navigate({ to: "/sign-in", replace: true });
    } catch {
      toastManager.add({
        title: "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  useGlobalShortcuts(
    createShortcutBindings({
      TOGGLE_THEME: toggleTheme,
      SIGN_OUT: isSigningOut
        ? undefined
        : () => {
            void handleSignOut();
          },
    }),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button aria-label="Open user menu" size="icon-lg" variant="ghost">
            <Avatar>
              {user.image ? (
                <AvatarImage
                  alt={user.name ?? "User"}
                  fetchPriority="high"
                  loading="eager"
                  src={buildImageUrl(user.image)}
                />
              ) : null}
              <AvatarFallback>
                {enableFacehash ? (
                  <Facehash
                    enableBlink
                    intensity3d="dramatic"
                    name={user.name ?? user.email}
                    size={32}
                  />
                ) : (
                  getInitials(user.name)
                )}
              </AvatarFallback>
            </Avatar>
          </Button>
        }
      />

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-normal">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-foreground">{user.name ?? "User"}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Badge className="mt-2 rounded-none p-2" size="sm" variant="outline">
              {snakeCaseToTitleCase(userRole ?? "")}
            </Badge>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <AnimateIcon animateOnHover>
            <DropdownMenuItem
              closeOnClick
              onClick={() => void router.navigate({ to: "/dashboard/settings/security" })}
            >
              <SettingsIcon aria-hidden />
              <span className="flex-1">Settings</span>
            </DropdownMenuItem>
          </AnimateIcon>
          <AnimateIcon animateOnHover>
            <DropdownMenuItem
              closeOnClick
              onClick={() => void router.navigate({ to: "/support/contact" })}
            >
              <MessageCircleQuestionIcon aria-hidden />
              <span className="flex-1">Support</span>
            </DropdownMenuItem>
          </AnimateIcon>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <AnimateIcon>
            <DropdownMenuItem closeOnClick={false} onClick={toggleTheme}>
              <ThemeToggleIcon animate={resolvedTheme === "dark"} />
              <span className="flex-1">Toggle theme</span>
              <DropdownMenuShortcut>
                {getShortcutLabelById(shortcutIds.TOGGLE_THEME)}
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </AnimateIcon>
          <AnimateIcon animateOnHover>
            <DropdownMenuItem closeOnClick onClick={() => openShortcutsDialog()}>
              <KeyboardShortcutsIcon aria-hidden />
              <span className="flex-1">Keyboard shortcuts</span>
              <DropdownMenuShortcut>
                {getShortcutLabelById(shortcutIds.OPEN_SHORTCUTS_HELP)}
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </AnimateIcon>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <AnimateIcon animateOnHover>
          <DropdownMenuItem
            closeOnClick={false}
            disabled={isSigningOut}
            onClick={handleSignOut}
            variant="destructive"
          >
            <LogOutIcon />
            <span>{isSigningOut ? "Signing out..." : "Log out"}</span>
            <DropdownMenuShortcut className="text-destructive group-focus/dropdown-menu-item:text-destructive">
              {getShortcutLabelById(shortcutIds.SIGN_OUT)}
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </AnimateIcon>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
