import { buttonVariants } from "@sycom/ui/components/button-variants";
import { Compass } from "@sycom/ui/components/animated/icons/compass";

import { Link } from "./foresight-link";

export default function NotFound() {
  return (
    <div className="relative flex size-full items-center justify-center overflow-hidden bg-background p-8">
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="flex size-36 items-center justify-center text-primary">
          <Compass animate animation="default-loop" loop loopDelay={900} size={100} />
        </div>

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
