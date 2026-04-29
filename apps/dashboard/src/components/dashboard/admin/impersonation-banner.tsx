import { useMutation } from "@tanstack/react-query";
import { EyeOffIcon } from "lucide-react";

import { useUser } from "@/hooks/use-user";
import { useTRPC } from "@/lib/trpc/client";
import { Button } from "@sycom/ui/components/button";
import { toastManager } from "@sycom/ui/components/toast";

export function ImpersonationBanner() {
  const trpc = useTRPC();
  const {
    data: { session, user },
  } = useUser();

  const stopImpersonatingMutation = useMutation({
    ...trpc.admin.stopImpersonatingUser.mutationOptions({
      onSuccess: () => {
        window.location.assign("/dashboard/admin");
      },
      onError: (error) => {
        toastManager.add({
          title: "Failed to stop impersonating",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  if (!session.impersonatedBy) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-warning/15 px-4 py-2 text-xs text-warning-foreground">
      <span>
        You are impersonating <strong>{user.name}</strong> ({user.email})
      </span>
      <Button
        aria-label="Stop impersonating"
        disabled={stopImpersonatingMutation.isPending}
        onClick={() => stopImpersonatingMutation.mutate()}
        size="sm"
        variant="outline"
      >
        <EyeOffIcon className="size-4" />
        Stop impersonating
      </Button>
    </div>
  );
}
