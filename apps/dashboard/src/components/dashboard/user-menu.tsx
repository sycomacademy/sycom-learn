import { Button } from "@sycom/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sycom/ui/components/dropdown-menu";
import { toastManager } from "@sycom/ui/components/toast";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { authClient } from "@/lib/auth/auth-client";
import { useUser } from "@/lib/auth/use-user";
import { SESSION_QUERY_KEY } from "@/lib/auth/session";

export default function UserMenu() {
  const me = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>{me.name}</DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>{me.email}</DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={async () => {
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
              }
            }}
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
