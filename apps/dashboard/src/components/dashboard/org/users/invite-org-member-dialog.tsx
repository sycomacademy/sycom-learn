import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Plus } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";

import {
  buildStudentProfilePayload,
  InviteStudentProfileFields,
  type OrgStudentProfileField,
  validateStudentProfileValuesClient,
} from "@/components/dashboard/org/users/invite-student-profile-fields";
import { ORG_INVITABLE_ROLE_OPTIONS } from "@/components/dashboard/org/users/org-members-schema";
import { useTRPC } from "@/lib/trpc/client";
import { Button } from "@sycom/ui/components/button";
import { buttonVariants } from "@sycom/ui/components/button-variants";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sycom/ui/components/select";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@sycom/ui/components/tabs";
import { Textarea } from "@sycom/ui/components/textarea";
import { toastManager } from "@sycom/ui/components/toast";
import { cn } from "@sycom/ui/lib/utils";

const orgInvitableRoleMini = z.enum(["admin", "teacher", "student"] as const);

const singleInviteSchema = z.object({
  email: z.email("Enter a valid email"),
  name: z.string().check(z.minLength(1, "Name is required"), z.maxLength(120)),
  role: orgInvitableRoleMini,
});

type SingleInviteInput = z.infer<typeof singleInviteSchema>;

const bulkRowSchema = z.object({
  email: z.email(),
  name: z.string().check(z.minLength(1), z.maxLength(120)),
  role: orgInvitableRoleMini,
});

type BulkParsedRow = {
  name: string;
  email: string;
  role: string;
  studentProfile: Record<string, string>;
};

type BulkInviteRow = z.infer<typeof bulkRowSchema> & {
  studentProfile?: Record<string, unknown>;
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  out.push(current.trim());
  return out.map((cell) => cell.replace(/^"|"$/g, ""));
}

function buildBulkCsvHeader(requiredStudentFieldIds: string[]): string {
  return ["name", "email", "role", ...requiredStudentFieldIds].join(",");
}

function parseBulkInviteCsv(text: string, requiredStudentFieldIds: string[]): BulkParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error(
      `Add a header row (${buildBulkCsvHeader(requiredStudentFieldIds)}) and at least one data row.`,
    );
  }

  const headerCells = parseCsvLine(lines[0] ?? "").map((c) => c.toLowerCase().trim());
  const nameI = headerCells.indexOf("name");
  const emailI = headerCells.indexOf("email");
  const roleI = headerCells.indexOf("role");

  if (nameI === -1 || emailI === -1 || roleI === -1) {
    throw new Error(
      `The first row must include headers: ${buildBulkCsvHeader(requiredStudentFieldIds)}`,
    );
  }

  const allowed = new Set(["name", "email", "role", ...requiredStudentFieldIds]);
  for (const header of headerCells) {
    if (!allowed.has(header)) {
      throw new Error(`Unknown column "${header}". Allowed: ${[...allowed].join(", ")}`);
    }
  }

  for (const fieldId of requiredStudentFieldIds) {
    if (!headerCells.includes(fieldId)) {
      throw new Error(`Missing required student profile column: ${fieldId}`);
    }
  }

  const fieldIndices = Object.fromEntries(
    requiredStudentFieldIds.map((id) => [id, headerCells.indexOf(id)]),
  ) as Record<string, number>;

  const rows: BulkParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i] ?? "");
    const name = (cells[nameI] ?? "").trim();
    const email = (cells[emailI] ?? "").trim();
    const role = (cells[roleI] ?? "").trim().toLowerCase();
    if (!name && !email && !role) continue;

    const studentProfile: Record<string, string> = {};
    for (const fieldId of requiredStudentFieldIds) {
      const idx = fieldIndices[fieldId];
      studentProfile[fieldId] = (cells[idx] ?? "").trim();
    }

    rows.push({ name, email, role, studentProfile });
  }
  return rows;
}

function validateBulkRows(
  raw: BulkParsedRow[],
  requiredStudentFieldIds: string[],
  requiredStudentFields: OrgStudentProfileField[],
): BulkInviteRow[] {
  if (raw.length === 0) {
    throw new Error("No data rows found after the header.");
  }
  if (raw.length > 200) {
    throw new Error("Maximum 200 rows per batch.");
  }

  const parsed: BulkInviteRow[] = [];
  let rowNum = 1;
  for (const row of raw) {
    rowNum++;
    const result = bulkRowSchema.safeParse(row);
    if (!result.success) {
      throw new Error(
        `Row ${rowNum}: check name, a valid email, and role (admin, teacher, student).`,
      );
    }

    const { role } = result.data;

    if (role === "student") {
      for (const fieldId of requiredStudentFieldIds) {
        if (!(row.studentProfile[fieldId] ?? "").trim()) {
          throw new Error(`Row ${rowNum}: student row missing required field "${fieldId}".`);
        }
      }
      parsed.push({
        ...result.data,
        studentProfile: buildStudentProfilePayload(requiredStudentFields, row.studentProfile),
      });
    } else {
      for (const fieldId of requiredStudentFieldIds) {
        if ((row.studentProfile[fieldId] ?? "").trim()) {
          throw new Error(
            `Row ${rowNum}: student profile columns must be empty when role is not student.`,
          );
        }
      }
      parsed.push(result.data);
    }
  }
  return parsed;
}

function emptyStudentProfileValues(fieldIds: string[]): Record<string, string> {
  return Object.fromEntries(fieldIds.map((id) => [id, ""]));
}

export function InviteOrgMemberDialog() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<"paste" | "file">("paste");
  const [bulkText, setBulkText] = useState("");
  const [studentProfileValues, setStudentProfileValues] = useState<Record<string, string>>({});
  const [studentProfileErrors, setStudentProfileErrors] = useState<
    Record<string, string | undefined>
  >({});
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const listInvitesKey = trpc.organization.listInvitations.queryKey();
  const listMembersKey = trpc.organization.listMembers.queryKey();

  const { data: studentFieldsData, refetch: refetchStudentFields } = useQuery({
    ...trpc.organization.getStudentProfileFields.queryOptions(),
    enabled: open,
    staleTime: 0,
  });

  const studentFields = studentFieldsData?.fields ?? [];
  const requiredStudentFields = useMemo(
    () => studentFields.filter((f) => f.required),
    [studentFields],
  );
  const requiredStudentFieldIds = useMemo(
    () => requiredStudentFields.map((f) => f.id),
    [requiredStudentFields],
  );

  const bulkCsvHeader = buildBulkCsvHeader(requiredStudentFieldIds);
  const bulkCsvExampleRow = useMemo(() => {
    const studentExtras = requiredStudentFieldIds.map((fieldId) => {
      const field = studentFields.find((f) => f.id === fieldId);
      return field?.type === "number" ? "2024" : "value";
    });
    return ["Jane Doe", "jane@school.edu", "student", ...studentExtras].join(",");
  }, [requiredStudentFieldIds, studentFields]);

  const form = useForm<SingleInviteInput>({
    resolver: zodResolver(singleInviteSchema),
    defaultValues: { email: "", name: "", role: "student" },
  });

  const selectedRole = form.watch("role");

  const resetStudentProfileState = useCallback(() => {
    setStudentProfileValues(emptyStudentProfileValues(studentFields.map((f) => f.id)));
    setStudentProfileErrors({});
  }, [studentFields]);

  useEffect(() => {
    if (open) {
      void refetchStudentFields();
    }
  }, [open, refetchStudentFields]);

  useEffect(() => {
    if (!open || studentFields.length === 0) return;
    setStudentProfileValues((prev) => {
      const next = emptyStudentProfileValues(studentFields.map((f) => f.id));
      for (const field of studentFields) {
        if (field.id in prev) {
          next[field.id] = prev[field.id] ?? "";
        }
      }
      return next;
    });
  }, [open, studentFields]);

  const inviteMutation = useMutation({
    ...trpc.organization.inviteMember.mutationOptions({
      onSuccess: async (_data, input) => {
        toastManager.add({
          title: "Invite sent",
          description: `${input.name} will receive an invitation email at ${input.email}.`,
          type: "success",
        });
        form.reset({ email: "", name: "", role: "student" });
        resetStudentProfileState();
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: listInvitesKey }),
          queryClient.invalidateQueries({ queryKey: listMembersKey }),
        ]);
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

  const bulkMutation = useMutation({
    ...trpc.organization.bulkInviteMembers.mutationOptions({
      onSuccess: async (summary) => {
        const skipped =
          summary.skippedAlreadyMember + summary.skippedExistingUser + summary.skippedPendingInvite;
        toastManager.add({
          title: "Bulk invites processed",
          description: `Sent ${summary.sent}. Skipped ${skipped}. Email failures ${summary.failedToSendEmail}.`,
          type: "success",
        });
        setBulkText("");
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: listInvitesKey }),
          queryClient.invalidateQueries({ queryKey: listMembersKey }),
        ]);
        setOpen(false);
      },
      onError: (error) => {
        toastManager.add({
          title: "Bulk invite failed",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  const onSubmitSingle = async (data: SingleInviteInput) => {
    let studentProfile: Record<string, unknown> | undefined;
    if (data.role === "student" && studentFields.length > 0) {
      const errors = validateStudentProfileValuesClient(studentFields, studentProfileValues);
      setStudentProfileErrors(errors);
      if (Object.values(errors).some(Boolean)) return;
      studentProfile = buildStudentProfilePayload(studentFields, studentProfileValues);
    }

    try {
      await inviteMutation.mutateAsync({
        ...data,
        studentProfile,
      });
    } catch {
      // toast via onError
    }
  };

  const runBulk = useCallback(
    async (text: string) => {
      try {
        const raw = parseBulkInviteCsv(text, requiredStudentFieldIds);
        const rows = validateBulkRows(raw, requiredStudentFieldIds, requiredStudentFields);
        await bulkMutation.mutateAsync({ rows });
      } catch (e) {
        toastManager.add({
          title: "Invalid CSV",
          description: e instanceof Error ? e.message : "Could not read CSV.",
          type: "error",
        });
      }
    },
    [bulkMutation, requiredStudentFieldIds, requiredStudentFields],
  );

  const onBulkFile = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      void runBulk(text);
    };
    reader.readAsText(file);
  };

  return (
    <Dialog
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          form.reset({ email: "", name: "", role: "student" });
          setBulkText("");
          resetStudentProfileState();
        }
      }}
      open={open}
    >
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Invite members
          </Button>
        }
      />
      <DialogPopup className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite members</DialogTitle>
          <DialogDescription>
            Send invitation emails so people can join this organization.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <Tabs className="w-full" defaultValue="single">
            <TabsList className="max-full w-full">
              <TabsTab className="flex-1" value="single">
                Single
              </TabsTab>
              <TabsTab className="flex-1" value="bulk">
                Bulk (CSV)
              </TabsTab>
            </TabsList>

            <TabsPanel className="pt-4" value="single">
              <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmitSingle)}>
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
                          <FieldLabel>Organization role</FieldLabel>
                          <FormControl>
                            <Select
                              items={ORG_INVITABLE_ROLE_OPTIONS.map((option) => ({
                                value: option.value,
                                label: option.label,
                              }))}
                              onValueChange={(value) => {
                                if (value) {
                                  field.onChange(value);
                                  if (value !== "student") {
                                    setStudentProfileErrors({});
                                  }
                                }
                              }}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {ORG_INVITABLE_ROLE_OPTIONS.map((option) => (
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

                  {selectedRole === "student" ? (
                    <InviteStudentProfileFields
                      errors={studentProfileErrors}
                      fields={studentFields}
                      onChange={(fieldId, value) => {
                        setStudentProfileValues((prev) => ({ ...prev, [fieldId]: value }));
                        setStudentProfileErrors((prev) => ({ ...prev, [fieldId]: undefined }));
                      }}
                      values={studentProfileValues}
                    />
                  ) : null}

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
            </TabsPanel>

            <TabsPanel className="pt-4" value="bulk">
              <Tabs
                onValueChange={(value) => setBulkMode(value as "paste" | "file")}
                value={bulkMode}
              >
                <TabsList className="max-full w-full">
                  <TabsTab className="flex-1" value="paste">
                    Paste
                  </TabsTab>
                  <TabsTab className="flex-1" value="file">
                    Upload file
                  </TabsTab>
                </TabsList>

                <TabsPanel className="pt-3" value="paste">
                  <label className="sr-only" htmlFor={`${id}-bulk-csv`}>
                    CSV contents
                  </label>
                  <Textarea
                    className="min-h-32 font-mono text-xs"
                    id={`${id}-bulk-csv`}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={`${bulkCsvHeader}\n${bulkCsvExampleRow}`}
                    value={bulkText}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    First row: <code className="text-xs">{bulkCsvHeader}</code>. Student rows must
                    fill required profile columns; other roles leave those columns empty. Optional
                    profile fields are not part of bulk upload.
                  </p>
                </TabsPanel>

                <TabsPanel className="pt-3" value="file">
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <FileUp className="mx-auto size-8 opacity-50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      CSV with the same columns as paste mode.
                    </p>
                    <label className="mt-3 inline-block cursor-pointer">
                      <input
                        accept=".csv,text/csv"
                        className="sr-only"
                        onChange={(e) => onBulkFile(e.target.files)}
                        type="file"
                      />
                      <span className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
                        Choose file
                      </span>
                    </label>
                  </div>
                </TabsPanel>
              </Tabs>

              <DialogFooter className="mt-4" variant="bare">
                <DialogClose render={<Button type="button" variant="outline" />}>Close</DialogClose>
                {bulkMode === "paste" ? (
                  <Button
                    loading={bulkMutation.isPending}
                    onClick={() => void runBulk(bulkText)}
                    type="button"
                  >
                    Send invitations
                  </Button>
                ) : null}
              </DialogFooter>
            </TabsPanel>
          </Tabs>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
