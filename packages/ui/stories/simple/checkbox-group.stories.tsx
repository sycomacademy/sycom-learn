import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "@sycom/ui/components/checkbox";
import { CheckboxGroup } from "@sycom/ui/components/checkbox-group";
import { Label } from "@sycom/ui/components/label";

const meta = {
  title: "Simple/CheckboxGroup",
  component: CheckboxGroup,
  tags: ["autodocs"],
  args: {
    defaultValue: ["email"],
    disabled: false,
  },
} satisfies Meta<typeof CheckboxGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

const notificationValues = [
  { id: "cg-email", label: "Email", value: "email" as const },
  { id: "cg-sms", label: "SMS", value: "sms" as const },
  { id: "cg-push", label: "Push", value: "push" as const },
];

export const Playground: Story = {
  render: (args) => (
    <CheckboxGroup {...args} className="max-w-sm">
      {notificationValues.map((item) => (
        <div className="flex items-center gap-2" key={item.value}>
          <Checkbox id={item.id} value={item.value} />
          <Label htmlFor={item.id}>{item.label}</Label>
        </div>
      ))}
    </CheckboxGroup>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: ["email"] },
  render: (args) => (
    <CheckboxGroup {...args} className="max-w-sm">
      {notificationValues.map((item) => (
        <div className="flex items-center gap-2" key={item.value}>
          <Checkbox id={`${item.id}-d`} value={item.value} />
          <Label htmlFor={`${item.id}-d`}>{item.label}</Label>
        </div>
      ))}
    </CheckboxGroup>
  ),
};

export const AllSelected: Story = {
  args: { defaultValue: ["email", "sms", "push"] },
  render: (args) => (
    <CheckboxGroup {...args} className="max-w-sm">
      {notificationValues.map((item) => (
        <div className="flex items-center gap-2" key={item.value}>
          <Checkbox id={`${item.id}-all`} value={item.value} />
          <Label htmlFor={`${item.id}-all`}>{item.label}</Label>
        </div>
      ))}
    </CheckboxGroup>
  ),
};
