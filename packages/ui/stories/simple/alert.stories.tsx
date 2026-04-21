import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertCircleIcon, AlertTriangleIcon, CheckCircle2Icon, InfoIcon } from "lucide-react";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@sycom/ui/components/alert";
import { Button } from "@sycom/ui/components/button";

const meta = {
  title: "Simple/Alert",
  component: Alert,
  tags: ["autodocs"],
  args: {
    variant: "default",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "error", "info", "success", "warning"],
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Alert {...args} className="max-w-md">
      <InfoIcon />
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>
        You can add components to the alert that adjust to the current variant automatically.
      </AlertDescription>
    </Alert>
  ),
};

export const WithAction: Story = {
  render: (args) => (
    <Alert {...args} className="max-w-md" variant="default">
      <InfoIcon />
      <AlertTitle>Update available</AlertTitle>
      <AlertDescription>
        Install the latest version for bug fixes and improvements.
      </AlertDescription>
      <AlertAction>
        <Button size="sm" variant="outline">
          Open app
        </Button>
      </AlertAction>
    </Alert>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Alert>
        <InfoIcon />
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>General message or notification.</AlertDescription>
      </Alert>
      <Alert variant="info">
        <InfoIcon />
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>Context or guidance for the user.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <CheckCircle2Icon />
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>Your action completed successfully.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertTriangleIcon />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Something may need your attention.</AlertDescription>
      </Alert>
      <Alert variant="error">
        <AlertCircleIcon />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>We could not process this request. Try again.</AlertDescription>
      </Alert>
    </div>
  ),
};

export const NoIcon: Story = {
  render: () => (
    <Alert className="max-w-md" variant="info">
      <AlertTitle>No icon</AlertTitle>
      <AlertDescription>
        Alerts work without a leading icon when the layout is simpler.
      </AlertDescription>
    </Alert>
  ),
};
