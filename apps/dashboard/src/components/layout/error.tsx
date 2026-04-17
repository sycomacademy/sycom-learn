import { Button } from "@sycom/ui/components/button";
import { useRouter } from "@tanstack/react-router";
import { CloudOff } from "lucide-react";
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
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <CloudOff className="h-12 w-12 text-muted-foreground" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Service temporarily unavailable
          </h1>
          <p className="text-muted-foreground">
            We&apos;re having trouble loading this page right now. Please try again in a moment.
          </p>
        </div>

        <Button onClick={onRetry} size="lg" loading={retrying}>
          {retrying ? "Retrying..." : "Try again"}
        </Button>
      </div>
    </main>
  );
}
