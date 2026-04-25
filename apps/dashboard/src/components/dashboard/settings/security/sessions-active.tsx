import { Badge } from "@sycom/ui/components/badge";
import { Button } from "@sycom/ui/components/button";
import { Card, CardDescription, CardHeader, CardPanel, CardTitle } from "@sycom/ui/components/card";
import { toastManager } from "@sycom/ui/components/toast";
import { formatDeviceLabel, isMobileAgent } from "@sycom/ui/lib/device";
import { LaptopIcon, SmartphoneIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTRPCClient } from "@/lib/trpc/client";
import type { Session } from "@sycom/db/schema/auth";

export function SecuritySessionsActive({
  currentSessionToken,
  initialSessions,
}: {
  currentSessionToken: string;
  initialSessions: Session[];
}) {
  const trpcClient = useTRPCClient();
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);

  const handleRevokeSession = async (token: string) => {
    setPendingToken(token);
    try {
      await trpcClient.profile.revokeSession.mutate({ token });
      setSessions((previous) => previous.filter((session) => session.token !== token));
      toastManager.add({ title: "Session revoked", type: "success" });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Couldn't reach server. Check your connection and try again.";
      toastManager.add({
        title: "Couldn't revoke session",
        description: message,
        type: "error",
      });
    } finally {
      setPendingToken(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Sessions</CardTitle>
        <CardDescription className="text-sm">
          Manage devices where you're signed in.
        </CardDescription>
      </CardHeader>
      <CardPanel className="space-y-3 pt-0">
        <h3 className="text-sm font-semibold">Current session</h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active sessions found.</p>
        ) : (
          sessions.map((session) => {
            const isCurrentSession = session.token === currentSessionToken;
            const isPending = pendingToken === session.token;
            const canRevoke = !isCurrentSession;
            const DeviceIcon = isMobileAgent(session.userAgent) ? SmartphoneIcon : LaptopIcon;

            return (
              <div
                className="flex flex-wrap items-center justify-between gap-2 border px-3 py-2.5"
                key={session.token}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <DeviceIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  <p className="truncate text-sm">{formatDeviceLabel(session.userAgent)}</p>
                  {isCurrentSession ? (
                    <Badge className="shrink-0" variant="success">
                      This device
                    </Badge>
                  ) : null}
                </div>
                <Button
                  className="px-0 text-destructive hover:text-destructive"
                  disabled={!canRevoke}
                  loading={isPending}
                  onClick={async () => await handleRevokeSession(session.token)}
                  size="sm"
                  type="button"
                  variant="link"
                >
                  {isCurrentSession ? "Current session" : "Sign out"}
                </Button>
              </div>
            );
          })
        )}
      </CardPanel>
    </Card>
  );
}
