import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
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
} from "@sycom/ui/components/dialog";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import { Input } from "@sycom/ui/components/input";
import { toastManager } from "@sycom/ui/components/toast";

import type { OrgCohortRow } from "./org-cohorts-schema";

const renameOrgCohortSchema = z.object({
  name: z.string().trim().min(1, "Cohort name is required").max(120),
});

type RenameOrgCohortInput = z.infer<typeof renameOrgCohortSchema>;

export function RenameOrgCohortDialog({
  cohort,
  open,
  onOpenChange,
}: {
  cohort: OrgCohortRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<RenameOrgCohortInput>({
    resolver: zodResolver(renameOrgCohortSchema),
    defaultValues: { name: cohort.name },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: cohort.name });
    }
  }, [cohort.name, form, open]);

  const renameMutation = useMutation({
    ...trpc.organization.updateCohort.mutationOptions({
      onSuccess: async (updated) => {
        toastManager.add({
          title: "Cohort renamed",
          description: `Renamed to ${updated.name}.`,
          type: "success",
        });
        onOpenChange(false);
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.organization.listCohorts.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.organization.getCohort.queryKey({ cohortId: cohort.id }),
          }),
        ]);
      },
      onError: (error) => {
        toastManager.add({
          title: "Couldn't rename cohort",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  return (
    <Dialog
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          form.reset({ name: cohort.name });
        }
      }}
      open={open}
    >
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename cohort</DialogTitle>
          <DialogDescription>Update the display name for this cohort.</DialogDescription>
        </DialogHeader>

        <DialogPanel>
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(async (data) => {
                await renameMutation.mutateAsync({ cohortId: cohort.id, name: data.name });
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
                <Button loading={renameMutation.isPending} type="submit">
                  Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
