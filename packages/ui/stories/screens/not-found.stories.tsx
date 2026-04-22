import type { Meta, StoryObj } from "@storybook/react-vite";

import { Compass } from "@sycom/ui/components/animated/icons/compass";
import { buttonVariants } from "@sycom/ui/components/button-variants";

/** Mirrors `apps/dashboard/src/components/layout/not-found.tsx` with a plain link (no TanStack Router). */
function NotFoundScreen() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_60%)] opacity-10" />

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

        <a
          className={buttonVariants({ size: "lg", variant: "default" })}
          href="/dashboard"
          onClick={(event) => event.preventDefault()}
        >
          Go home
        </a>
      </div>
    </div>
  );
}

const meta = {
  title: "Screens/Not found",
  component: NotFoundScreen,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof NotFoundScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
