import type { Meta, StoryObj } from "@storybook/react-vite";

import { ConstructionIcon } from "@sycom/ui/components/animated/icons/construction";
import { contacts } from "@sycom/ui/lib/constants";
import { cn } from "@sycom/ui/lib/utils";

/** Mirrors `apps/dashboard/src/components/layout/global-error.tsx` (blog URL uses a static preview base). */
const blogUrl = "https://sycomsolutions.com/blog";

function GlobalErrorScreen({ mode = "screen" }: { mode?: "screen" | "container" }) {
  return (
    <main
      className={cn(
        "relative flex w-full flex-col items-center justify-center overflow-hidden bg-background p-8",
        mode === "screen" ? "min-h-screen" : "h-full",
      )}
    >
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
          <a href={blogUrl} rel="noreferrer" target="_blank" className="hover:underline">
            blog →
          </a>
        </p>
      </div>
    </main>
  );
}

const meta = {
  title: "Screens/Global error",
  component: GlobalErrorScreen,
  args: {
    mode: "screen",
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GlobalErrorScreen>;

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
      <GlobalErrorScreen {...args} />
    </div>
  ),
};
