import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useTRPC } from "@/lib/trpc/client";
import { Button } from "@sycom/ui/components/button";
import {
  Dialog,
  DialogClose,
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
import { toastManager } from "@sycom/ui/components/toast";

const createOrgCohortSchema = z.object({
  name: z.string().trim().min(1, "Cohort name is required").max(120),
});

type CreateOrgCohortInput = z.infer<typeof createOrgCohortSchema>;

const DEFAULT_VALUES: CreateOrgCohortInput = {
  name: "",
};

export function CreateOrgCohortDialog(): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const form = useForm<CreateOrgCohortInput>({
    resolver: zodResolver(createOrgCohortSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const createMutation = useMutation({
    ...trpc.organization.createCohort.mutationOptions({
      onSuccess: async () => {
        toastManager.add({ title: "Cohort created", type: "success" });
        setOpen(false);
        form.reset(DEFAULT_VALUES);
        await queryClient.invalidateQueries({ queryKey: trpc.organization.listCohorts.queryKey() });
      },
      onError: (error) => {
        toastManager.add({
          title: "Couldn't create cohort",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  return (
    <Dialog
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          form.reset(DEFAULT_VALUES);
        }
      }}
      open={open}
    >
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Create cohort
          </Button>
        }
      />
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create cohort</DialogTitle>
          <DialogDescription>
            Create a learner cohort to organize members and assign courses.
          </DialogDescription>
        </DialogHeader>

        <DialogPanel>
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(async (data) => {
                await createMutation.mutateAsync({ name: data.name });
              })}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel>Cohort name</FieldLabel>
                      <FormControl>
                        <Input autoComplete="off" placeholder="Frontend Team" {...field} />
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
                <Button loading={createMutation.isPending} type="submit">
                  Create cohort
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
