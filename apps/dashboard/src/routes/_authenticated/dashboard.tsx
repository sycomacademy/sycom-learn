import { useUser } from "@/hooks/use-user";
import { Button } from "@sycom/ui/components/button";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { authClient } from "@/lib/auth/auth-client";
import { SESSION_QUERY_KEY } from "@/lib/auth/session";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const data = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  return (
    <div>
      <Button
        size={"lg"}
        onClick={async () => {
          await authClient.signOut();
          queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY });
          router.navigate({ to: "/sign-in" });
        }}
      >
        Sign out
      </Button>
      Dashboard
      <pre> {JSON.stringify(data, null, 2)} </pre>
    </div>
  );
}
