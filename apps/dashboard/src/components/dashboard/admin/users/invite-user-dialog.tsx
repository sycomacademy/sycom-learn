import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";

import { useTRPC } from "@/lib/trpc/client";
import { Button } from "@sycom/ui/components/button";
import {
  Dialog,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogClose,
} from "@sycom/ui/components/dialog";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import { Input } from "@sycom/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sycom/ui/components/select";
import { toastManager } from "@sycom/ui/components/toast";

import { ROLE_OPTIONS } from "./users-helpers";
import { Plus } from "lucide-react";

const inviteUserSchema = z.object({
  email: z.email("Enter a valid email"),
  name: z.string().check(z.minLength(1, "Name is required"), z.maxLength(120)),
  role: z.enum(["platform_admin", "content_creator", "public_student"]),
});

type InviteUserInput = z.infer<typeof inviteUserSchema>;

export function InviteUserDialog() {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const listInvitesQueryKey = trpc.admin.listPlatformInvitations.queryKey();

  const form = useForm<InviteUserInput>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { email: "", name: "", role: "public_student" },
  });

  const inviteMutation = useMutation({
    ...trpc.admin.inviteUser.mutationOptions({
      onSuccess: async (_data, input) => {
        toastManager.add({
          title: "Invite sent",
          description: `${input.name} will receive an invitation email at ${input.email}.`,
          type: "success",
        });
        form.reset();
        await queryClient.invalidateQueries({ queryKey: listInvitesQueryKey });
        setOpen(false);
      },
      onError: (error) => {
        toastManager.add({
          title: "Couldn't send invite",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  const onSubmit = async (data: InviteUserInput) => {
    try {
      await inviteMutation.mutateAsync(data);
    } catch (error) {
      toastManager.add({
        title: "Couldn't send invite",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        type: "error",
      });
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            New invite
          </Button>
        }
      ></DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
          <DialogDescription>
            Send an invitation email so the user can set a password and create their account.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel>Email</FieldLabel>
                      <FormControl>
                        <Input
                          autoComplete="off"
                          placeholder="user@example.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel>Name</FieldLabel>
                      <FormControl>
                        <Input autoComplete="off" placeholder="Jane Doe" {...field} />
                      </FormControl>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel>Role</FieldLabel>
                      <FormControl>
                        <Select
                          items={ROLE_OPTIONS.map((option) => ({
                            value: option.value,
                            label: option.label,
                          }))}
                          onValueChange={(value) => {
                            if (value) {
                              field.onChange(value);
                            }
                          }}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {ROLE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />

              <DialogFooter variant="bare">
                <DialogClose render={<Button type="button" variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button loading={form.formState.isSubmitting} type="submit">
                  Send invite
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}

export { InviteUserDialog as PublicInviteDialog };
