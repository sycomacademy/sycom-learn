import { buttonVariants } from "@sycom/ui/components/button";
import { env } from "@sycom/env/web";

import { GlobalErrorIllustration } from "./global-error-illustration";

const blogUrl = `${env.VITE_WEBSITE_URL}/blog`;

export default function GlobalError() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_55%)] opacity-[0.07]" />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-8 text-center">
        <GlobalErrorIllustration className="w-full" />

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            We&apos;ll be back in a moment
          </h1>
          <p className="text-pretty text-muted-foreground">
            Sycom is undergoing maintenance. We&apos;ll be back online shortly. You can contact us
            at
            <a className={buttonVariants({ variant: "link" })} href="mailto:support@sycom.io">
              support@sycom.io
            </a>
            or
            <a className={buttonVariants({ variant: "link" })} href="tel:+447403064482">
              +44 7403 064482
            </a>
            .
          </p>
        </div>

        <a
          className={buttonVariants({ size: "lg", variant: "outline" })}
          href={blogUrl}
          target="_blank"
        >
          In the meantime, check out our blog →
        </a>
      </div>
    </main>
  );
}
