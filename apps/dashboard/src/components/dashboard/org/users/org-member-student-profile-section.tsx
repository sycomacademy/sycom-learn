import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useTRPC } from "@/lib/trpc/client";
import { Button } from "@sycom/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@sycom/ui/components/dialog";
import { JsonViewer } from "@sycom/ui/components/elements/json-viewer";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import { Input } from "@sycom/ui/components/input";
import { toastManager } from "@sycom/ui/components/toast";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

type OrgMemberDetails = AppRouterOutputs["organization"]["getMember"];
type OrgStudentProfileField =
  AppRouterOutputs["organization"]["getStudentProfileFields"]["fields"][number];

function studentProfileForJsonViewer(
  fields: OrgStudentProfileField[],
  values: OrgMemberDetails["studentProfile"],
): Record<string, string | number | null> {
  const out: Record<string, string | number | null> = {};
  for (const field of fields) {
    const value = values[field.id];
    out[field.label] = value === undefined ? null : value;
  }
  return out;
}

type EditStudentProfileDialogProps = {
  member: OrgMemberDetails;
  fields: OrgStudentProfileField[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

function EditStudentProfileDialog({
  member,
  fields,
  open,
  onOpenChange,
  onSaved,
}: EditStudentProfileDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const buildDefaultValues = (): Record<string, string> =>
    Object.fromEntries(
      fields.map((field) => {
        const current = member.studentProfile[field.id];
        if (current === null || current === undefined) {
          return [field.id, ""];
        }
        return [field.id, String(current)];
      }),
    );

  const form = useForm<Record<string, string>>({
    defaultValues: buildDefaultValues(),
  });

  useEffect(() => {
    if (open) {
      form.reset(buildDefaultValues());
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member.studentProfile, fields]);

  const updateProfile = useMutation(
    trpc.organization.updateMemberStudentProfile.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.organization.getMember.queryOptions({ memberId: member.memberId }),
        );
        toastManager.add({ title: "Student profile updated", type: "success" });
        onOpenChange(false);
        onSaved();
      },
    }),
  );

  const onSubmit = async (data: Record<string, string>) => {
    const values: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = data[field.id] ?? "";
      if (field.type === "number") {
        values[field.id] = raw.trim() === "" ? null : Number(raw);
      } else {
        const str = raw.trim();
        values[field.id] = str.length === 0 ? null : str;
      }
    }

    try {
      await updateProfile.mutateAsync({ memberId: member.memberId, values });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toastManager.add({ title: message, type: "error" });
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit student profile</DialogTitle>
          <DialogDescription>
            Update organization-specific fields for {member.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {fields.map((field) => (
              <FormField
                control={form.control}
                key={field.id}
                name={field.id}
                render={({ field: inputField, fieldState }) => (
                  <FormItem>
                    <Field>
                      <FieldLabel>
                        {field.label}
                        {field.required ? " *" : null}
                      </FieldLabel>
                      <FormControl>
                        <Input
                          {...inputField}
                          autoComplete="off"
                          placeholder={field.placeholder ?? undefined}
                          type={field.type === "number" ? "number" : "text"}
                          value={
                            inputField.value === null || inputField.value === undefined
                              ? ""
                              : String(inputField.value)
                          }
                        />
                      </FormControl>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                  </FormItem>
                )}
              />
            ))}
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <Button loading={form.formState.isSubmitting} type="submit">
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function OrgMemberStudentProfileSection({ member }: { member: OrgMemberDetails }) {
  const trpc = useTRPC();
  const [editOpen, setEditOpen] = useState(false);

  const fieldsQuery = useQuery({
    ...trpc.organization.getStudentProfileFields.queryOptions(),
    enabled: member.role === "student",
  });

  const fields = fieldsQuery.data?.fields ?? [];
  const jsonData = useMemo(
    () => studentProfileForJsonViewer(fields, member.studentProfile),
    [fields, member.studentProfile],
  );

  if (member.role !== "student") return null;
  if (fields.length === 0) return null;

  return (
    <>
      <div className="mt-6 border-t pt-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Student profile</h3>
          <Button onClick={() => setEditOpen(true)} size="sm" type="button" variant="outline">
            <PencilIcon className="size-3.5" />
            Edit
          </Button>
        </div>
        <JsonViewer
          className="rounded-md border bg-muted/30 p-2"
          collapsed={1}
          copyPath
          data={JSON.parse(JSON.stringify(jsonData))}
          searchable
        />
      </div>

      <EditStudentProfileDialog
        fields={fields}
        member={member}
        onOpenChange={setEditOpen}
        onSaved={() => fieldsQuery.refetch()}
        open={editOpen}
      />
    </>
  );
}
