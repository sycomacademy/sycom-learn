import { createFileRoute } from "@tanstack/react-router";

import { SecurityChangePassword } from "@/components/dashboard/settings/security/change-password";
import { SecuritySessionsActive } from "@/components/dashboard/settings/security/sessions-active";
import { useUser } from "@/hooks/use-user";

export const Route = createFileRoute("/dashboard/settings/security")({
  loader: async ({ context }) => {
    const [accounts, sessions] = await Promise.all([
      context.queryClient.ensureQueryData(context.trpc.profile.listAccounts.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.profile.listSessions.queryOptions()),
    ]);

    return {
      hasPasswordAccount: accounts.some((account) => account.providerId === "credential"),
      sessions,
    };
  },
  component: SecuritySettings,
});

function SecuritySettings() {
  const { hasPasswordAccount, sessions } = Route.useLoaderData();
  const { session } = useUser();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <SecuritySessionsActive currentSessionToken={session.token} initialSessions={sessions} />
      <SecurityChangePassword hasPasswordAccount={hasPasswordAccount} />
    </div>
  );
}
