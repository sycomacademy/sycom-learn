import { Button } from "@sycom/ui/components/button";
import { CloudLightning } from "@sycom/ui/components/animated/icons/cloud-lightning";
import { cn } from "@sycom/ui/lib/utils";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";

export default function Error({ mode = "container" }: { mode?: "container" | "screen" }) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  const onRetry = async () => {
    setRetrying(true);
    try {
      await router.invalidate();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <main
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-background p-8",
        mode === "screen" ? "min-h-screen" : "h-full",
      )}
    >
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="flex size-36 items-center justify-center text-primary">
          <CloudLightning animate loop loopDelay={600} size={100} />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Service temporarily unavailable
          </h1>
          <p className="text-muted-foreground">
            We&apos;re having trouble loading this page right now. Please try again in a moment.
          </p>
        </div>

        <Button loading={retrying} onClick={onRetry} size="lg">
          {retrying ? "Retrying..." : "Try again"}
        </Button>
      </div>
    </main>
  );
}
