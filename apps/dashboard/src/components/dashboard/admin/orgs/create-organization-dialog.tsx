import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { ReactElement } from "react";

import { useTRPC } from "@/lib/trpc/client";
import {
  Dialog,
  DialogClose,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@sycom/ui/components/dialog";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import { Input } from "@sycom/ui/components/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@sycom/ui/components/input-group";
import { toastManager } from "@sycom/ui/components/toast";
import { slugify } from "@sycom/ui/lib/string";
import { Button } from "@sycom/ui/components/button";
import {
  createOrganizationSchema,
  DEFAULT_CREATE_ORGANIZATION_VALUES,
  type CreateOrganizationInput,
} from "./organizations-schema";

type CreateOrganizationDialogProps = {
  trigger?: ReactElement;
};

export function CreateOrganizationDialog({ trigger }: CreateOrganizationDialogProps) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const listOrgsQueryKey = trpc.admin.listOrganizations.queryKey();
  const [slugTouched, setSlugTouched] = useState(false);

  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: DEFAULT_CREATE_ORGANIZATION_VALUES,
  });

  const createMutation = useMutation({
    ...trpc.admin.createOrganization.mutationOptions({
      onSuccess: async (data, input) => {
        toastManager.add({
          title: "Organization created",
          description:
            data.owner.kind === "existing"
              ? `${input.name} is live and we emailed ${input.ownerEmail} a link to organization setup (they're already signed up).`
              : `${input.name} is live and we emailed ${input.ownerEmail} to set their password and join as owner.`,
          type: "success",
        });
        setOpen(false);
        form.reset(DEFAULT_CREATE_ORGANIZATION_VALUES);
        setSlugTouched(false);
        await queryClient.invalidateQueries({ queryKey: listOrgsQueryKey });
      },
      onError: (error) => {
        toastManager.add({
          title: "Couldn't create organization",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  const onSubmit = async (data: CreateOrganizationInput) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        slug: data.slug,
        ownerFirstName: data.ownerFirstName,
        ownerLastName: data.ownerLastName,
        ownerEmail: data.ownerEmail,
      });
    } catch (error) {
      toastManager.add({
        title: "Couldn't create organization",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        type: "error",
      });
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      form.reset(DEFAULT_CREATE_ORGANIZATION_VALUES);
      setSlugTouched(false);
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      {trigger ? <DialogTrigger render={trigger}></DialogTrigger> : null}
      <DialogPopup className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create organization</DialogTitle>
          <DialogDescription>
            Spin up a new tenant and assign a primary contact who becomes the organization owner.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel>Organization name</FieldLabel>
                      <FormControl>
                        <Input
                          autoComplete="off"
                          placeholder="Ordal Academy"
                          {...field}
                          onChange={(event) => {
                            const value = event.currentTarget.value;
                            field.onChange(value);
                            if (!slugTouched) {
                              form.setValue("slug", slugify(value), {
                                shouldValidate: true,
                              });
                            }
                          }}
                        />
                      </FormControl>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel>Slug</FieldLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupInput
                            autoComplete="off"
                            placeholder="ordal"
                            {...field}
                            onChange={(event) => {
                              setSlugTouched(true);
                              field.onChange(event.currentTarget.value);
                            }}
                          />
                          <InputGroupAddon align="inline-end">
                            <span className="text-xs text-muted-foreground">
                              .app.learn.sycomsolutions.com
                            </span>
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="ownerFirstName"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel>Owner first name</FieldLabel>
                        <FormControl>
                          <Input autoComplete="off" placeholder="Ada" {...field} />
                        </FormControl>
                        <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                      </Field>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerLastName"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel>Owner last name</FieldLabel>
                        <FormControl>
                          <Input autoComplete="off" placeholder="Lovelace" {...field} />
                        </FormControl>
                        <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                      </Field>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="ownerEmail"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel>Owner email</FieldLabel>
                      <FormControl>
                        <Input
                          autoComplete="off"
                          placeholder="ada@ordal.com"
                          type="email"
                          {...field}
                        />
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
                  Create organization
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
