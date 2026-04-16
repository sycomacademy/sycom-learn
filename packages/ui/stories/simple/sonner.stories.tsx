import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";

import { Button } from "../../src/components/button";
import { Toaster } from "../../src/components/sonner";

const meta = {
  title: "Simple/Toaster",
  component: Toaster,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
} satisfies Meta<typeof Toaster>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => toast("Event has been created")}>
        Default
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.message("Event has been created", {
            description: "Monday, January 3rd at 6:00pm",
          })
        }
      >
        Description
      </Button>
      <Button variant="outline" onClick={() => toast.success("Event has been created")}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.info("Be at the venue 10 minutes early")}>
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.warning("Start time cannot be earlier than 8am")}
      >
        Warning
      </Button>
      <Button variant="outline" onClick={() => toast.error("Something went wrong")}>
        Error
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.promise(
            new Promise<{ name: string }>((resolve) => {
              setTimeout(() => resolve({ name: "Sonner" }), 1500);
            }),
            {
              loading: "Loading...",
              success: (data) => `${data.name} toast has been added`,
              error: "Error",
            },
          )
        }
      >
        Promise
      </Button>
    </div>
  ),
};
