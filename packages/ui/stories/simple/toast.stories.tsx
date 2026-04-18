import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@sycom/ui/components/button";
import { ToastProvider, type ToastPosition, toast } from "@sycom/ui/components/toast";

const POSITIONS: ToastPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

const meta = {
  title: "Simple/Toast",
  component: ToastProvider,
  tags: ["autodocs"],
  args: {
    position: "bottom-right",
  },
  argTypes: {
    position: {
      control: "select",
      options: POSITIONS,
    },
  },
  decorators: [
    (Story, context) => (
      <ToastProvider position={context.args.position as ToastPosition}>
        <Story />
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof ToastProvider>;

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
      <Button variant="outline" onClick={() => toast.success("Changes saved")}>
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
    </div>
  ),
};

export const WithAction: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast("File deleted", {
            description: "report.pdf was moved to trash",
            action: {
              label: "Undo",
              onClick: () => toast.success("Restored report.pdf"),
            },
          })
        }
      >
        Undoable delete
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error("Failed to publish", {
            action: {
              label: "Retry",
              onClick: () => toast.loading("Retrying…"),
            },
          })
        }
      >
        Retry on error
      </Button>
    </div>
  ),
};

export const Promise: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast.promise(
            new window.Promise<{ name: string }>((resolve) => {
              setTimeout(() => resolve({ name: "coss.ui" }), 1500);
            }),
            {
              loading: "Loading…",
              success: (data) => `${data.name} toast has been added`,
              error: "Failed to load",
            },
          )
        }
      >
        Resolve after 1.5s
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.promise(
            new window.Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error("Network error")), 1500);
            }),
            {
              loading: "Submitting…",
              success: "Done",
              error: (err) => (err instanceof Error ? err.message : "Failed"),
            },
          )
        }
      >
        Reject after 1.5s
      </Button>
    </div>
  ),
};

export const Persistent: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast.loading("Uploading…", {
            id: "upload",
            duration: 0,
          })
        }
      >
        Start upload
      </Button>
      <Button variant="outline" onClick={() => toast.success("Upload complete", { id: "upload" })}>
        Finish upload
      </Button>
      <Button variant="outline" onClick={() => toast.dismiss("upload")}>
        Dismiss upload
      </Button>
    </div>
  ),
};

export const Stacking: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() => {
          toast.success("First");
          setTimeout(() => toast.info("Second"), 200);
          setTimeout(() => toast.warning("Third"), 400);
          setTimeout(() => toast.error("Fourth"), 600);
        }}
      >
        Fire four toasts
      </Button>
    </div>
  ),
};
