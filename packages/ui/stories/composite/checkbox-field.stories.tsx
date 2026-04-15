import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "../../src/components/checkbox";
import { Label } from "../../src/components/label";

function CheckboxField({
  id,
  label,
  description,
  disabled,
  defaultChecked,
}: {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox id={id} disabled={disabled} defaultChecked={defaultChecked} />
      <div className="grid gap-1 leading-none">
        <Label htmlFor={id} className={disabled ? "opacity-50" : undefined}>
          {label}
        </Label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

const meta = {
  title: "Composite/Checkbox Field",
  component: CheckboxField,
  tags: ["autodocs"],
  args: {
    id: "terms",
    label: "Accept terms and conditions",
    description: "You agree to our Terms of Service and Privacy Policy.",
  },
} satisfies Meta<typeof CheckboxField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: {
    id: "checked",
    label: "Remember me",
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    id: "disabled",
    label: "Disabled option",
    description: "This option cannot be changed.",
    disabled: true,
  },
};

export const List: Story = {
  render: () => (
    <div className="space-y-4">
      <CheckboxField
        id="notifications"
        label="Email notifications"
        description="Receive email updates about your account."
      />
      <CheckboxField
        id="marketing"
        label="Marketing emails"
        description="Receive tips, product updates, and promotions."
      />
      <CheckboxField
        id="security"
        label="Security alerts"
        description="Get notified about unusual account activity."
        defaultChecked
      />
      <CheckboxField
        id="deprecated"
        label="Legacy option"
        description="This setting has been deprecated."
        disabled
      />
    </div>
  ),
};
