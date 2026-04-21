import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import { Button } from "@sycom/ui/components/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@sycom/ui/components/dialog";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import { Input } from "@sycom/ui/components/input";

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
});
type ProfileInput = z.infer<typeof profileSchema>;

function DialogFormStory({ submitDisabled = false }: { submitDisabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: "" },
    mode: "onBlur",
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button variant="outline" />}>Edit profile</DialogTrigger>
      <DialogPopup>
        <form
          className="flex max-h-full min-h-0 flex-1 flex-col"
          onSubmit={form.handleSubmit(() => {
            setOpen(false);
            form.reset();
          })}
        >
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
            <DialogDescription>Update how your name appears to others.</DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <Form {...form}>
              <FormField
                control={form.control}
                name="displayName"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel className="text-xs font-semibold text-muted-foreground">
                        Display name
                      </FieldLabel>
                      <FormControl>
                        <Input autoComplete="name" placeholder="Ada Lovelace" {...field} />
                      </FormControl>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />
            </Form>
          </DialogPanel>
          <DialogFooter>
            <Button disabled={submitDisabled} loading={form.formState.isSubmitting} type="submit">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}

const meta = {
  title: "Composite/Dialog Form",
  component: DialogFormStory,
  tags: ["autodocs"],
} satisfies Meta<typeof DialogFormStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SubmitDisabled: Story = {
  args: {
    submitDisabled: true,
  },
};
