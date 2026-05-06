import { zodResolver } from "@hookform/resolvers/zod";
import { uploadFile } from "@sycom/storage/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AvatarUploader } from "@sycom/ui/components/avatar-uploader";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@sycom/ui/components/alert-dialog";
import { Button } from "@sycom/ui/components/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@sycom/ui/components/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import { Input } from "@sycom/ui/components/input";
import { toastManager } from "@sycom/ui/components/toast";
import { cn } from "@sycom/ui/lib/utils";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

import { ORG_ACCENT_PRESETS } from "@/routes/onboarding/-org-brand-presets";
import { authClient } from "@/lib/auth/auth-client";
import { useTRPC, useTRPCClient } from "@/lib/trpc/client";

const accentFormSchema = z.object({
  accentHex: z
    .string()
    .check(z.regex(/^#[0-9A-Fa-f]{6}$/, "Use a six-digit hex color like #4f46e5")),
});

type AccentFormInput = z.infer<typeof accentFormSchema>;

type OrgWorkspaceSnapshot = AppRouterOutputs["organization"]["workspaceContext"];

export function OrgOrganizationGeneralSettings({ workspace }: { workspace: OrgWorkspaceSnapshot }) {
  const { organizationId, name, slug, logoPublicId, accentHex } = workspace;
  const trpcClient = useTRPCClient();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [logoUploadPending, setLogoUploadPending] = useState(false);
  const [deleteOrgOpen, setDeleteOrgOpen] = useState(false);
  const navigate = useNavigate();

  const deleteActiveOrg = useMutation(trpc.organization.deleteActiveOrganization.mutationOptions());

  const invalidateWorkspace = async () => {
    await queryClient.invalidateQueries(trpc.organization.workspaceContext.queryOptions());
  };

  const updateBranding = useMutation(
    trpc.organization.updateBranding.mutationOptions({
      onSuccess: async () => {
        await invalidateWorkspace();
      },
    }),
  );

  const accentForm = useForm<AccentFormInput>({
    resolver: zodResolver(accentFormSchema),
    defaultValues: { accentHex },
  });

  useEffect(() => {
    accentForm.reset({ accentHex });
  }, [accentHex, accentForm]);

  const onLogoCropComplete = async (blob: Blob, fileName: string) => {
    setLogoUploadPending(true);
    try {
      const signedParams = await trpcClient.storage.signUpload.mutate({
        folder: "organization_logos",
        entityType: "organization",
        entityId: organizationId,
      });
      const file = new File([blob], fileName, { type: blob.type });
      const result = await uploadFile({ file, signedParams });

      await trpcClient.storage.saveAsset.mutate({
        publicId: result.publicId,
        secureUrl: result.secureUrl,
        folder: "organization_logos",
        entityType: "organization",
        entityId: organizationId,
        resourceType: result.resourceType,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        name: fileName,
        tags: ["organization-logo"],
      });

      await updateBranding.mutateAsync({ logoPublicId: result.publicId });
      toastManager.add({ title: "Logo updated", type: "success" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Couldn't update logo. Please try again.";
      toastManager.add({ title: "Update failed", description: message, type: "error" });
    } finally {
      setLogoUploadPending(false);
    }
  };

  const onSubmitAccent = async (data: AccentFormInput) => {
    try {
      await updateBranding.mutateAsync({ accentHex: data.accentHex });
      toastManager.add({ title: "Accent color saved", type: "success" });
    } catch {
      toastManager.add({
        title: "Couldn't save color",
        description: "Something went wrong. Try again shortly.",
        type: "error",
      });
      accentForm.reset({ accentHex });
    }
  };

  const confirmDeleteOrganization = async () => {
    try {
      await deleteActiveOrg.mutateAsync();
      setDeleteOrgOpen(false);
      toastManager.add({
        title: "Organization deleted",
        description: `${name} has been permanently removed.`,
        type: "success",
      });

      const { error } = await authClient.organization.setActive({ organizationId: null });
      if (error) {
        toastManager.add({
          title: "Couldn't clear active workspace",
          description: error.message,
          type: "error",
        });
      }

      await queryClient.invalidateQueries(trpc.profile.get.queryOptions());
      await queryClient.invalidateQueries(trpc.organization.memberships.queryOptions());
      await navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Couldn't delete organization. Try again.";
      toastManager.add({ title: "Delete failed", description: message, type: "error" });
    }
  };

  return (
    <div className="space-y-4 px-6 pt-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Organization settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Brand your workspace across the LMS. Name and slug are managed by administrators.
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <AvatarUploader
            currentImagePublicId={logoPublicId ?? undefined}
            isUploading={logoUploadPending}
            name={name}
            onCropComplete={onLogoCropComplete}
          />
          <div>
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-sm text-muted-foreground">
              Square logo, shown in nav and learner-facing chrome.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Workspace profile</CardTitle>
          <CardDescription className="text-sm">
            Read-only identifiers. Contact support if you need a different slug or name.
          </CardDescription>
        </CardHeader>
        <CardPanel className="space-y-4 pb-6">
          <Field>
            <FieldLabel>Organization name</FieldLabel>
            <Input aria-readOnly disabled readOnly value={name} />
          </Field>
          <Field>
            <FieldLabel>Slug</FieldLabel>
            <Input aria-readOnly className="font-mono text-sm" disabled readOnly value={slug} />
            <FieldDescription>Used in URLs and references to this tenant.</FieldDescription>
          </Field>
        </CardPanel>
      </Card>

      <Card>
        <Form {...accentForm}>
          <form onSubmit={accentForm.handleSubmit(onSubmitAccent)}>
            <CardHeader>
              <CardTitle className="text-sm">Accent color</CardTitle>
              <CardDescription className="text-sm">Set your brand color</CardDescription>
            </CardHeader>
            <CardPanel className="space-y-6 py-0">
              <FormField
                control={accentForm.control}
                name="accentHex"
                render={({ field, fieldState }) => (
                  <FormItem className="space-y-4">
                    <Field>
                      <FieldLabel>Preset palettes</FieldLabel>
                      <div className="flex flex-wrap gap-3">
                        {ORG_ACCENT_PRESETS.map(({ hex: presetHex, label }) => (
                          <button
                            aria-label={`${label} ${presetHex}`}
                            aria-pressed={field.value === presetHex}
                            className={cn(
                              "relative size-10 shrink-0 rounded-full border border-border shadow-sm transition-shadow",
                              field.value === presetHex && "ring-2 ring-primary ring-offset-2",
                            )}
                            key={presetHex}
                            style={{ backgroundColor: presetHex }}
                            title={label}
                            type="button"
                            onClick={() => {
                              field.onChange(presetHex);
                            }}
                          />
                        ))}
                      </div>
                      <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="org-accent-picker">Custom</FieldLabel>
                      <FormControl>
                        <div className="flex max-w-48 items-center gap-3">
                          <input
                            className={cn(
                              "size-11 shrink-0 cursor-pointer overflow-hidden rounded-lg border bg-background",
                            )}
                            id="org-accent-picker"
                            type="color"
                            aria-label="Pick accent color"
                            value={field.value.toLowerCase()}
                            onChange={(event) => {
                              field.onChange(event.target.value);
                            }}
                          />
                          <Input
                            {...field}
                            autoComplete="off"
                            aria-label="Accent color hex"
                            className="font-mono text-sm"
                            spellCheck={false}
                          />
                        </div>
                      </FormControl>
                    </Field>
                  </FormItem>
                )}
              />
            </CardPanel>
            <CardFooter className="justify-end pt-0">
              <Button className="w-40" loading={accentForm.formState.isSubmitting} type="submit">
                {accentForm.formState.isSubmitting ? "Saving..." : "Save"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-sm text-destructive">Danger zone</CardTitle>
          <CardDescription className="text-sm">
            Permanently delete this organization, including members, cohorts, and invitations. This
            action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-end pt-0">
          <Button
            type="button"
            loading={deleteActiveOrg.isPending}
            variant="destructive"
            onClick={() => {
              setDeleteOrgOpen(true);
            }}
          >
            Delete organization
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog onOpenChange={setDeleteOrgOpen} open={deleteOrgOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete organization?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes <strong>{name}</strong> ({slug}) and removes all members,
              cohorts, and invitations tied to this workspace. Your account stays on Sycom, but
              everyone loses access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
            <Button
              loading={deleteActiveOrg.isPending}
              variant="destructive"
              type="button"
              onClick={() => void confirmDeleteOrganization()}
            >
              Delete organization
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
