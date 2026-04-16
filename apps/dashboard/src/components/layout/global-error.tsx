import { Button } from "@sycom/ui/components/button";
import { useRouter } from "@tanstack/react-router";
import { CloudOff } from "lucide-react";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

export default function GlobalError() {
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
    <ThemeProvider attribute="class" enableSystem>
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <CloudOff className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Service Unavailable
            </h1>
            <p className="text-muted-foreground">
              We&apos;re currently offline. Please check your connection and try again.
            </p>
          </div>

          <Button onClick={onRetry} size="lg" loading={retrying}>
            {retrying ? "Retrying..." : "Retry"}
          </Button>
        </div>
      </main>
    </ThemeProvider>
  );
}
