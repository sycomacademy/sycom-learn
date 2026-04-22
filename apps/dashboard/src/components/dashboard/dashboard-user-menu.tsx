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
import { useUser } from "@/hooks/use-user";
import { authClient } from "@/lib/auth/auth-client";
import { SESSION_QUERY_KEY } from "@/lib/auth/session";
import { getInitials, snakeCaseToTitleCase } from "@sycom/ui/lib/string";
import { Facehash } from "facehash";
import { AnimateIcon } from "@sycom/ui/components/animated/icons/icon";
import { ThemeToggleIcon } from "@sycom/ui/components/animated/icons/theme-toggle";
import { useTheme } from "next-themes";

export function DashboardUserMenu(): React.ReactElement {
  const { user, profile } = useUser();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const enableFacehash = profile.settings?.enableFacehash;

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      const { error } = await authClient.signOut();
      if (error) {
        toastManager.add({ title: error.message, type: "error" });
        return;
      }
      toastManager.add({ title: "Signed out", type: "success" });
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button aria-label="Open user menu" size="icon-lg" variant="ghost">
            <Avatar>
              {user.image ? <AvatarImage alt={user.name ?? "User"} src={user.image} /> : null}
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
              {snakeCaseToTitleCase(user.role ?? "")}
            </Badge>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <AnimateIcon>
            <DropdownMenuItem
              closeOnClick={false}
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              <ThemeToggleIcon animate={resolvedTheme === "dark"} />
              <span className="flex-1">Toggle theme</span>
              <DropdownMenuShortcut>Y</DropdownMenuShortcut>
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
              Q
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </AnimateIcon>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
