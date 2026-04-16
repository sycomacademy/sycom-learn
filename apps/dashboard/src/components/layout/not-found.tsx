import { buttonVariants } from "@sycom/ui/components/button";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_60%)] opacity-10" />

      <div className="relative z-10 flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
          <img
            alt="Sycom"
            className="size-8 object-contain"
            height={32}
            src="/sycom-logo.png"
            width={32}
          />
        </div>

        <div className="space-y-2">
          <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
            404 &middot; Not found
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">This page doesn&rsquo;t exist</h1>
          <p className="text-sm text-muted-foreground">
            The page you&rsquo;re looking for may have been moved or never existed. Head back to
            your dashboard to keep moving.
          </p>
        </div>

        <Link className={buttonVariants({ variant: "default" })} to="/dashboard">
          <ArrowLeftIcon className="size-4" />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
