import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button } from "@sycom/ui/components/button";
import { ToastProvider, type ToastPosition, toastManager } from "@sycom/ui/components/toast";

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

export const Default: Story = {
  render: () => (
    <Button
      onClick={() => {
        toastManager.add({
          description: "Monday, January 3rd at 6:00pm",
          title: "Event has been created",
        });
      }}
      variant="outline"
    >
      Default Toast
    </Button>
  ),
};

export const WithStatus: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() => {
          toastManager.add({
            description: "Your changes have been saved.",
            title: "Success!",
            type: "success",
          });
        }}
        variant="outline"
      >
        Success Toast
      </Button>
      <Button
        onClick={() => {
          toastManager.add({
            description: "There was a problem with your request.",
            title: "Uh oh! Something went wrong.",
            type: "error",
          });
        }}
        variant="outline"
      >
        Error Toast
      </Button>
      <Button
        onClick={() => {
          toastManager.add({
            description: "You can add components to your app using the cli.",
            title: "Heads up!",
            type: "info",
          });
        }}
        variant="outline"
      >
        Info Toast
      </Button>
      <Button
        onClick={() => {
          toastManager.add({
            description: "Your session is about to expire.",
            title: "Warning!",
            type: "warning",
          });
        }}
        variant="outline"
      >
        Warning Toast
      </Button>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <Button
      onClick={() => {
        toastManager.add({
          description: "Please wait while we process your request.",
          title: "Loading…",
          type: "loading",
        });
      }}
      variant="outline"
    >
      Loading Toast
    </Button>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Button
      onClick={() => {
        const id = toastManager.add({
          actionProps: {
            children: "Undo",
            onClick: () => {
              toastManager.close(id);
              toastManager.add({
                description: "The action has been reverted.",
                title: "Action undone",
                type: "info",
              });
            },
          },
          description: "You can undo this action.",
          timeout: 1_000_000,
          title: "Action performed",
          type: "success",
        });
      }}
      variant="outline"
    >
      Perform Action
    </Button>
  ),
};

export const Promise: Story = {
  render: () => (
    <Button
      onClick={() => {
        toastManager.promise(
          new window.Promise<string>((resolve, reject) => {
            const shouldSucceed = Math.random() > 0.3;
            setTimeout(() => {
              if (shouldSucceed) {
                resolve("Data loaded successfully");
              } else {
                reject(new Error("Failed to load data"));
              }
            }, 2000);
          }),
          {
            error: () => ({
              description: "Please try again.",
              title: "Something went wrong",
            }),
            loading: {
              description: "The promise is loading.",
              title: "Loading…",
            },
            success: (data: string) => ({
              description: `Success: ${data}`,
              title: "This is a success toast!",
            }),
          },
        );
      }}
      variant="outline"
    >
      Run Promise
    </Button>
  ),
};

const VARYING_HEIGHT_TEXTS = [
  "Short message.",
  "A bit longer message that spans two lines.",
  "This is a longer description that intentionally takes more vertical space to demonstrate stacking with varying heights.",
  "An even longer description that should span multiple lines so we can verify the clamped collapsed height and smooth expansion animation when hovering or focusing the viewport.",
];

function VaryingHeightsTrigger() {
  const [count, setCount] = useState(0);

  return (
    <Button
      onClick={() => {
        setCount((prev) => prev + 1);
        const description =
          VARYING_HEIGHT_TEXTS[Math.floor(Math.random() * VARYING_HEIGHT_TEXTS.length)];
        toastManager.add({
          description,
          title: `Toast ${count + 1} created`,
        });
      }}
      variant="outline"
    >
      With Varying Heights
    </Button>
  );
}

export const VaryingHeights: Story = {
  render: () => <VaryingHeightsTrigger />,
};

const DEDUP_ID = "coss-demo-dedup-toast";

export const Deduplicated: Story = {
  render: () => (
    <Button
      onClick={() => {
        toastManager.add({
          description: "Repeated clicks update this toast instead of stacking another.",
          id: DEDUP_ID,
          title: "Saved",
          type: "success",
        });
      }}
      variant="outline"
    >
      One Success Toast
    </Button>
  ),
};
