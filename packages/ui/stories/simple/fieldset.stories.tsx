import type { Meta, StoryObj } from "@storybook/react-vite";
import { Fieldset, FieldsetLegend } from "@sycom/ui/components/fieldset";
import { Input } from "@sycom/ui/components/input";
import { Label } from "@sycom/ui/components/label";

const meta = {
  title: "Simple/Fieldset",
  component: Fieldset,
  tags: ["autodocs"],
  args: {
    className: "max-w-sm space-y-3 rounded-lg border p-4",
  },
} satisfies Meta<typeof Fieldset>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Fieldset {...args}>
      <FieldsetLegend>Profile</FieldsetLegend>
      <div className="space-y-2">
        <div className="grid gap-1">
          <Label htmlFor="fs-name">Name</Label>
          <Input id="fs-name" name="name" placeholder="Alex" />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="fs-email">Email</Label>
          <Input id="fs-email" name="email" placeholder="you@example.com" type="email" />
        </div>
      </div>
    </Fieldset>
  ),
};

export const WithDescription: Story = {
  render: (args) => (
    <Fieldset {...args}>
      <FieldsetLegend>Delivery</FieldsetLegend>
      <p className="text-sm text-muted-foreground">We only use this to ship your order.</p>
      <div className="grid gap-1">
        <Label htmlFor="fs-street">Street</Label>
        <Input id="fs-street" name="street" placeholder="123 Main St" />
      </div>
    </Fieldset>
  ),
};

export const Disabled: Story = {
  render: (args) => (
    <Fieldset disabled {...args}>
      <FieldsetLegend>Read-only</FieldsetLegend>
      <div className="grid gap-1">
        <Label htmlFor="fs-locked">Account id</Label>
        <Input defaultValue="acct_01H…" id="fs-locked" name="id" readOnly />
      </div>
    </Fieldset>
  ),
};
