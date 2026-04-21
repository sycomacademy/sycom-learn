import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@sycom/ui/components/tabs";

const meta = {
  title: "Simple/Tabs",
  component: Tabs,
  tags: ["autodocs"],
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <Tabs className="w-80" defaultValue="account">
      <TabsList>
        <TabsTab value="account">Account</TabsTab>
        <TabsTab value="password">Password</TabsTab>
      </TabsList>
      <TabsPanel className="rounded-lg border bg-card p-4 text-sm" value="account">
        Account settings and profile details.
      </TabsPanel>
      <TabsPanel className="rounded-lg border bg-card p-4 text-sm" value="password">
        Update your password here.
      </TabsPanel>
    </Tabs>
  ),
};

export const Underline: Story = {
  render: () => (
    <Tabs className="w-80" defaultValue="overview">
      <TabsList variant="underline">
        <TabsTab value="overview">Overview</TabsTab>
        <TabsTab value="billing">Billing</TabsTab>
        <TabsTab value="team">Team</TabsTab>
      </TabsList>
      <TabsPanel className="pt-3 text-sm text-muted-foreground" value="overview">
        High-level metrics for this project.
      </TabsPanel>
      <TabsPanel className="pt-3 text-sm text-muted-foreground" value="billing">
        Invoices and payment methods.
      </TabsPanel>
      <TabsPanel className="pt-3 text-sm text-muted-foreground" value="team">
        Members and invitations.
      </TabsPanel>
    </Tabs>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Tabs className="w-full max-w-md" defaultValue="general" orientation="vertical">
      <TabsList>
        <TabsTab value="general">General</TabsTab>
        <TabsTab value="notifications">Notifications</TabsTab>
      </TabsList>
      <TabsPanel className="min-h-24 flex-1 rounded-lg border bg-card p-4 text-sm" value="general">
        General preferences.
      </TabsPanel>
      <TabsPanel
        className="min-h-24 flex-1 rounded-lg border bg-card p-4 text-sm"
        value="notifications"
      >
        Notification channels.
      </TabsPanel>
    </Tabs>
  ),
};
