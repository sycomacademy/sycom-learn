import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileUp, Plus } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";

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

function parseBulkInviteCsv(text: string): Array<{ name: string; email: string; role: string }> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error("Add a header row (name,email,role) and at least one data row.");
  }
  const headerCells = parseCsvLine(lines[0] ?? "").map((c) => c.toLowerCase().trim());
  const nameI = headerCells.indexOf("name");
  const emailI = headerCells.indexOf("email");
  const roleI = headerCells.indexOf("role");
  if (nameI === -1 || emailI === -1 || roleI === -1) {
    throw new Error("The first row must be headers: name,email,role");
  }
  const rows: Array<{ name: string; email: string; role: string }> = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i] ?? "");
    const name = (cells[nameI] ?? "").trim();
    const email = (cells[emailI] ?? "").trim();
    const role = (cells[roleI] ?? "").trim().toLowerCase();
    if (!name && !email && !role) continue;
    rows.push({ name, email, role });
  }
  return rows;
}

function validateBulkRows(
  raw: Array<{ name: string; email: string; role: string }>,
): z.infer<typeof bulkRowSchema>[] {
  if (raw.length === 0) {
    throw new Error("No data rows found after the header.");
  }
  if (raw.length > 200) {
    throw new Error("Maximum 200 rows per batch.");
  }

  const parsed: z.infer<typeof bulkRowSchema>[] = [];
  let rowNum = 1;
  for (const row of raw) {
    rowNum++;
    const result = bulkRowSchema.safeParse(row);
    if (!result.success) {
      throw new Error(
        `Row ${rowNum}: check name, a valid email, and role (admin, teacher, student).`,
      );
    }
    parsed.push(result.data);
  }
  return parsed;
}

export function InviteOrgMemberDialog() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<"paste" | "file">("paste");
  const [bulkText, setBulkText] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const listInvitesKey = trpc.organization.listInvitations.queryKey();
  const listMembersKey = trpc.organization.listMembers.queryKey();

  const form = useForm<SingleInviteInput>({
    resolver: zodResolver(singleInviteSchema),
    defaultValues: { email: "", name: "", role: "student" },
  });

  const inviteMutation = useMutation({
    ...trpc.organization.inviteMember.mutationOptions({
      onSuccess: async (_data, input) => {
        toastManager.add({
          title: "Invite sent",
          description: `${input.name} will receive an invitation email at ${input.email}.`,
          type: "success",
        });
        form.reset({ email: "", name: "", role: "student" });
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
    try {
      await inviteMutation.mutateAsync(data);
    } catch {
      // toast via onError
    }
  };

  const runBulk = useCallback(
    async (text: string) => {
      try {
        const raw = parseBulkInviteCsv(text);
        const rows = validateBulkRows(raw);
        await bulkMutation.mutateAsync({ rows });
      } catch (e) {
        toastManager.add({
          title: "Invalid CSV",
          description: e instanceof Error ? e.message : "Could not read CSV.",
          type: "error",
        });
      }
    },
    [bulkMutation],
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
                    placeholder={`name,email,role\nJane Doe,jane@school.edu,teacher`}
                    value={bulkText}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    First row must be <code className="text-xs">name,email,role</code>. Roles:
                    admin, teacher, or student. Rows that already have an account or membership are
                    skipped.
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
