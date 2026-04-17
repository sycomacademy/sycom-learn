import { buttonVariants } from "@sycom/ui/components/button";
import { ConstructionIcon } from "@sycom/ui/components/animated/icons/construction";
import { env } from "@sycom/env/web";
import { contacts } from "@sycom/ui/lib/constants";

const blogUrl = `${env.VITE_WEBSITE_URL}/blog`;

export default function GlobalError() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_55%)] opacity-[0.07]" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="flex size-24 items-center justify-center border text-primary">
          <ConstructionIcon color="currentColor" size={56} animate />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            We&apos;ll be back in a moment
          </h1>
          <p className="text-pretty text-muted-foreground">
            Sycom is undergoing maintenance. We&apos;ll be back online shortly.
            <br />
            You can contact us at
            <a
              className={buttonVariants({ variant: "link" })}
              href={`mailto:${contacts.support.email.contact}`}
            >
              {contacts.support.email.contact}
            </a>
            or
            <a
              className={buttonVariants({ variant: "link" })}
              href={`tel:${contacts.support.phone.contact}`}
            >
              {contacts.support.phone.contact}
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
