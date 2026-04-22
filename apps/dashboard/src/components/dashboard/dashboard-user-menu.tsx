"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { HomeIcon, LogOutIcon, MoonIcon, SettingsIcon, SunIcon, UserIcon } from "lucide-react";
import { useTheme } from "next-themes";
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
import { Link } from "@/components/layout/foresight-link";
import { useUser } from "@/hooks/use-user";
import { authClient } from "@/lib/auth/auth-client";
import { SESSION_QUERY_KEY } from "@/lib/auth/session";

const PLATFORM_PREFIX_RE = /^platform_/;
const ORG_PREFIX_RE = /^org_/;
const UNDERSCORE_RE = /_/g;
const WORD_START_RE = /\b\w/g;

function formatRole(role: string): string {
  const prefix = role.startsWith("platform_") ? PLATFORM_PREFIX_RE : ORG_PREFIX_RE;
  return role
    .replace(prefix, "")
    .replace(UNDERSCORE_RE, " ")
    .replace(WORD_START_RE, (char) => char.toUpperCase());
}

export function DashboardUserMenu(): React.ReactElement {
  const profile = useUser();
  const user = profile.user;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { resolvedTheme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const initials = React.useMemo(() => {
    const firstChar = user.name?.trim().charAt(0) || user.email?.charAt(0) || "?";
    return firstChar.toUpperCase();
  }, [user.email, user.name]);

  const roleBadge = formatRole(user.role ?? "platform_student");
  const isDark = resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button aria-label="Open user menu" size="icon-lg" variant="ghost">
            <Avatar>
              {user.image ? <AvatarImage alt={user.name ?? "User"} src={user.image} /> : null}
              <AvatarFallback>{initials}</AvatarFallback>
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
            <Badge className="mt-2" size="sm" variant="outline">
              {roleBadge}
            </Badge>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link to="/dashboard" />}>
            <UserIcon />
            <span className="flex-1">Dashboard</span>
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link to="/dashboard/settings" />}>
            <SettingsIcon />
            <span className="flex-1">Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem closeOnClick={false} onClick={() => setTheme(isDark ? "light" : "dark")}>
          {isMounted ? isDark ? <SunIcon /> : <MoonIcon /> : <MoonIcon />}
          <span className="flex-1">Switch theme</span>
          <DropdownMenuShortcut>Shift+T</DropdownMenuShortcut>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link to="/" />}>
            <HomeIcon />
            <span>Homepage</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={isSigningOut}
          onClick={async () => {
            if (isSigningOut) return;
            setIsSigningOut(true);
            try {
              const { error } = await authClient.signOut();
              if (error) {
                toastManager.add({ title: error.message, type: "error" });
                return;
              }
              queryClient.setQueryData(SESSION_QUERY_KEY, null);
              router.navigate({ to: "/sign-in" });
            } catch {
              toastManager.add({
                title: "Couldn't reach server. Check your connection and try again.",
                type: "error",
              });
            } finally {
              setIsSigningOut(false);
            }
          }}
          variant="destructive"
        >
          <LogOutIcon />
          <span>{isSigningOut ? "Signing out..." : "Log out"}</span>
          <DropdownMenuShortcut>Shift+Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
