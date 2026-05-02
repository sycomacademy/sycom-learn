"use client";

import { useEffect, useState } from "react";

import type { ProfileSettings } from "@sycom/db/schema/profile";
import { getTimeOfDayGreetingForTimeZone } from "@sycom/ui/lib/date";
import { emailLocalPart, parseName } from "@sycom/ui/lib/string";
import { Skeleton } from "@sycom/ui/components/skeleton";

export type DashboardGreetingProps = {
  profileSettings?: ProfileSettings | null;
  userEmail?: string | null | undefined;
  userName?: string | null | undefined;
};

export function DashboardGreeting({
  profileSettings,
  userEmail,
  userName,
}: DashboardGreetingProps): React.ReactElement {
  const useDeviceTimezone = profileSettings?.useDeviceTimezone ?? true;
  const useTimeBasedGreeting = useDeviceTimezone === true;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!useTimeBasedGreeting) {
      return;
    }

    const interval = setInterval(() => setNow(new Date()), 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [useTimeBasedGreeting]);

  const greeting = useTimeBasedGreeting ? getTimeOfDayGreetingForTimeZone(tz, now) : "Welcome";

  const fromName =
    typeof userName === "string" && userName.trim().length > 0
      ? parseName(userName.trim()).firstName || undefined
      : undefined;
  const fromEmail =
    typeof userEmail === "string" && userEmail.trim().length > 0
      ? emailLocalPart(userEmail)
      : undefined;
  const label = fromName || fromEmail || undefined;

  return (
    <h2 className="text-lg font-semibold tracking-tight text-foreground">
      {greeting},{" "}
      {label ? (
        <span className="text-foreground">{label}</span>
      ) : (
        <Skeleton className="inline-block h-5 w-24 align-middle" />
      )}
    </h2>
  );
}
