import { buttonVariants } from "@sycom/ui/components/button";

import { ForesightLink } from "../foresight-link";

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
          <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            The page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.
          </p>
        </div>

        <ForesightLink className={buttonVariants({ variant: "default" })} to="/dashboard">
          Go home
        </ForesightLink>
      </div>
    </div>
  );
}
