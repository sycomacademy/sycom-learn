import { buttonVariants } from "@sycom/ui/components/button";
import { env } from "@sycom/env/web";
import { Construction } from "lucide-react";

const blogUrl = `${env.VITE_WEBSITE_URL}/blog`;

export default function GlobalError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <Construction className="h-12 w-12 text-muted-foreground" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            We&apos;ll be back in a moment
          </h1>
          <p className="text-muted-foreground">
            Sycom is undergoing maintenance. We&apos;ll be back online shortly. You can contact us
            at <a href="mailto:support@sycom.io">support@sycom.io</a> or{" "}
            <a href="tel:+447403064482">+44 7403 064482</a>.
          </p>
        </div>

        <a
          className={buttonVariants({ variant: "outline" })}
          href={blogUrl}
          rel="noreferrer"
          target="_blank"
        >
          In the meantime, check out our blog →
        </a>
      </div>
    </main>
  );
}
