import { useEffect, useState } from "react";
import { Spinner } from "@sycom/ui/components/spinner";

import type { AutoSaveHookStatus } from "@/hooks/use-auto-save";

function savedRelativePhrase(lastSavedAt: Date) {
  const elapsedSec = Math.round((Date.now() - lastSavedAt.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, {
    numeric: "auto",
  });

  if (elapsedSec < 45) return "Saved just now";

  if (elapsedSec < 7200) {
    return `Saved ${rtf.format(-Math.max(1, Math.round(elapsedSec / 60)), "minute")}`;
  }

  if (elapsedSec < 86_400) {
    return `Saved ${rtf.format(-Math.round(elapsedSec / 3600), "hour")}`;
  }

  return `Saved ${rtf.format(-Math.round(elapsedSec / 86_400), "day")}`;
}

type AutoSaveStatusProps = {
  lastSavedAt: Date | null;
  status: AutoSaveHookStatus;
};

export function AutoSaveStatus({ lastSavedAt, status }: AutoSaveStatusProps) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (status !== "saved" || !lastSavedAt) return undefined;

    const id = window.setInterval(() => {
      tick((n) => n + 1);
    }, 10_000);

    return () => clearInterval(id);
  }, [lastSavedAt, status]);

  if (status === "idle") return null;

  if (status === "dirty") {
    return <p className="text-sm text-muted-foreground">Unsaved changes</p>;
  }

  if (status === "saving") {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-3.5" />
        Saving...
      </p>
    );
  }

  if (status === "error") {
    return <p className="text-sm text-destructive">Couldn&apos;t save. Click Save to retry.</p>;
  }

  // saved
  if (!lastSavedAt) return null;

  return <p className="text-sm text-muted-foreground">{savedRelativePhrase(lastSavedAt)}</p>;
}
