import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import {
  Combobox,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@sycom/ui/components/combobox";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormField, FormItem } from "@sycom/ui/components/form";

const FRUITS = ["Apple", "Banana", "Cherry", "Dragon fruit"] as const;

const fruitSchema = z.object({
  fruit: z.string().min(1, "Pick a fruit"),
});
type FruitInput = z.infer<typeof fruitSchema>;

function ComboboxFieldStory({
  defaultValue = "",
  disabled = false,
  triggerOnMount = false,
}: {
  defaultValue?: string;
  disabled?: boolean;
  triggerOnMount?: boolean;
}) {
  const form = useForm<FruitInput>({
    resolver: zodResolver(fruitSchema),
    defaultValues: { fruit: defaultValue },
    mode: "onChange",
  });

  useEffect(() => {
    if (triggerOnMount) void form.trigger();
  }, [form, triggerOnMount]);

  return (
    <Form {...form} className="flex w-full max-w-80 flex-col gap-4">
      <FormField
        control={form.control}
        name="fruit"
        render={({ field, fieldState }) => (
          <FormItem>
            <Field invalid={!!fieldState.error}>
              <FieldLabel className="text-xs font-semibold text-muted-foreground">Fruit</FieldLabel>
              <Combobox
                disabled={disabled}
                items={[...FRUITS]}
                onValueChange={(v) => field.onChange(v ?? "")}
                value={field.value ? field.value : null}
              >
                <ComboboxInput aria-invalid={!!fieldState.error} placeholder="Search fruits…" />
                <ComboboxPopup>
                  <ComboboxList>
                    {(item: string) => (
                      <ComboboxItem key={item} value={item}>
                        {item}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxPopup>
              </Combobox>
              <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
            </Field>
          </FormItem>
        )}
      />
    </Form>
  );
}

const meta = {
  title: "Composite/Combobox Field",
  component: ComboboxFieldStory,
  tags: ["autodocs"],
} satisfies Meta<typeof ComboboxFieldStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: "Apple",
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
    defaultValue: "Banana",
    disabled: true,
  },
};
