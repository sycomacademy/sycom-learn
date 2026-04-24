import { Suspense, lazy } from "react";
import { BRAND, Image } from "@sycom/ui/image";

import { Link } from "@/components/layout/foresight-link";
import { FlickeringGrid } from "./flickering-grid";

const LoginTestimonials = lazy(() =>
  import("./testimonials").then((mod) => ({ default: mod.LoginTestimonials })),
);

export function AuthLeftPanel() {
  return (
    <>
      <FlickeringGrid
        className="absolute inset-0 z-0 bg-primary/70 dark:bg-primary"
        color="rgb(254, 243, 199)"
        flickerChance={0.1}
        gridGap={12}
        maxOpacity={0.12}
        squareSize={24}
      />

      <Link
        className="absolute top-6 left-6 z-20 flex items-center gap-2 transition-opacity hover:opacity-80"
        to="/"
      >
        <div className="flex size-10 items-center justify-center rounded-md bg-white/10">
          <Image
            alt="Sycom Solutions logo"
            className="size-10 object-contain"
            height={40}
            src={BRAND.LOGO}
            width={40}
          />
        </div>
      </Link>

      <div className="relative z-10 flex h-full w-full items-center justify-center p-8">
        <div className="max-w-lg">
          <Suspense fallback={<div className="h-64" />}>
            <LoginTestimonials />
          </Suspense>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32"
        style={{
          background: "linear-gradient(to bottom, black, transparent)",
        }}
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32"
        style={{
          background: "linear-gradient(to top, black, transparent)",
        }}
      />
    </>
  );
}
