import { Button } from "@sycom/ui/components/button";
import { CloudLightning } from "@sycom/ui/components/animated/icons/cloud-lightning";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";

export default function Error() {
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
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_60%)] opacity-[0.07]" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="flex size-24 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
          <CloudLightning animate loop loopDelay={600} size={56} />
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
