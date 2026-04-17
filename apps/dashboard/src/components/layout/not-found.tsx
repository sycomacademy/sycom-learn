import { buttonVariants } from "@sycom/ui/components/button";

import { Link } from "../foresight-link";
import { NotFoundIllustration } from "./not-found-illustration";

export default function NotFound() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_60%)] opacity-10" />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-8 text-center">
        <NotFoundIllustration className="w-full" />

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            The page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.
          </p>
        </div>

        <Link className={buttonVariants({ size: "lg", variant: "default" })} to="/dashboard">
          Go home
        </Link>
      </div>
    </div>
  );
}
