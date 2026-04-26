import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { CloudLightning } from "@sycom/ui/components/animated/icons/cloud-lightning";
import { Button } from "@sycom/ui/components/button";
import { cn } from "@sycom/ui/lib/utils";

/** Mirrors `apps/dashboard/src/components/layout/error.tsx` without router invalidation (demo retry delay only). */
function RouteErrorScreen({ mode = "screen" }: { mode?: "screen" | "container" }) {
  const [retrying, setRetrying] = useState(false);

  const onRetry = async () => {
    setRetrying(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
    } finally {
      setRetrying(false);
    }
  };

  return (
    <main
      className={cn(
        "relative flex w-full flex-col items-center justify-center overflow-hidden bg-background p-8",
        mode === "screen" ? "min-h-svh" : "h-full",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)_0%,transparent_60%)] opacity-[0.07]" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="flex size-36 items-center justify-center text-primary">
          <CloudLightning animate loop loopDelay={600} size={100} />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Service temporarily unavailable
          </h1>
          <p className="text-muted-foreground">
            We&apos;re having trouble loading this page right now. Please try again in a moment.
          </p>
        </div>

        <Button loading={retrying} onClick={() => void onRetry()} size="lg">
          {retrying ? "Retrying..." : "Try again"}
        </Button>
      </div>
    </main>
  );
}

const meta = {
  title: "Screens/Error",
  component: RouteErrorScreen,
  args: {
    mode: "screen",
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof RouteErrorScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InDashboardContainer: Story = {
  args: {
    mode: "container",
  },
  parameters: {
    layout: "padded",
  },
  render: (args) => (
    <div className="h-[520px] w-full rounded-lg border">
      <RouteErrorScreen {...args} />
    </div>
  ),
};
