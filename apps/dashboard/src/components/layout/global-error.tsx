import { buttonVariants } from "@sycom/ui/components/button-variants";
import { ConstructionIcon } from "@sycom/ui/components/animated/icons/construction";
import { env } from "@sycom/env/web";
import { contacts } from "@sycom/ui/lib/constants";

const blogUrl = `${env.VITE_WEBSITE_URL}/blog`;

export default function GlobalError() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-8">
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="flex size-36 items-center justify-center text-primary">
          <ConstructionIcon color="currentColor" animate size={100} />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            We&apos;ll be back in a moment
          </h1>
          <p className="text-pretty text-muted-foreground">
            Sycom is undergoing maintenance. We&apos;ll be back online shortly. You can contact us
            at{" "}
            <a href={`mailto:${contacts.support.email.contact}`} className="hover:underline">
              {contacts.support.email.contact}
            </a>{" "}
            or by phone at{" "}
            <a href={`tel:${contacts.support.phone.contact}`} className="hover:underline">
              {contacts.support.phone.contact}
            </a>
            .
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          In the meantime, check out our{" "}
          <a href={blogUrl} target="_blank" className="hover:underline">
            blog →
          </a>
        </p>
      </div>
    </main>
  );
}
