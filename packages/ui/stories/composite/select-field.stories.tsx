import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormField, FormItem } from "@sycom/ui/components/form";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@sycom/ui/components/select";

const countrySchema = z.object({
  country: z.string().min(1, "Choose a country"),
});
type CountryInput = z.infer<typeof countrySchema>;

function SelectFieldStory({
  defaultValue = "",
  disabled = false,
  triggerOnMount = false,
}: {
  defaultValue?: string;
  disabled?: boolean;
  triggerOnMount?: boolean;
}) {
  const form = useForm<CountryInput>({
    resolver: zodResolver(countrySchema),
    defaultValues: { country: defaultValue },
    mode: "onChange",
  });

  useEffect(() => {
    if (triggerOnMount) void form.trigger();
  }, [form, triggerOnMount]);

  return (
    <Form {...form}>
      <div className="w-80">
        <FormField
          control={form.control}
          name="country"
          render={({ field, fieldState }) => (
            <FormItem>
              <Field invalid={!!fieldState.error}>
                <FieldLabel className="text-xs font-semibold text-muted-foreground">
                  Country
                </FieldLabel>
                <Select
                  disabled={disabled}
                  onValueChange={field.onChange}
                  value={field.value || null}
                >
                  <SelectTrigger aria-invalid={!!fieldState.error}>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="mx">Mexico</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                  </SelectPopup>
                </Select>
                <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
              </Field>
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}

const meta = {
  title: "Composite/Select Field",
  component: SelectFieldStory,
  tags: ["autodocs"],
} satisfies Meta<typeof SelectFieldStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: "us",
  },
};

export const WithError: Story = {
  args: {
    defaultValue: "",
    triggerOnMount: true,
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: "ca",
    disabled: true,
  },
};
