import { zodResolver } from "@hookform/resolvers/zod";
import { uploadFile } from "@sycom/storage/client";
import { AvatarUploader as AvatarUploaderUI } from "@sycom/ui/components/avatar-uploader";
import { Button } from "@sycom/ui/components/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@sycom/ui/components/card";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import { Input } from "@sycom/ui/components/input";
import { toastManager } from "@sycom/ui/components/toast";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";

import { contacts } from "@sycom/ui/lib/constants";
import { useUser, useUserMutation } from "@/hooks/use-user";
import { useTRPCClient } from "@/lib/trpc/client";
import { capitalize, parseName } from "@sycom/ui/lib/string";

const fullNameSchema = z.object({
  firstName: z
    .string()
    .check(z.minLength(1, "First name is required"), z.maxLength(50, "Too long")),
  lastName: z.string().check(z.maxLength(50, "Too long")),
});

type FullNameInput = z.infer<typeof fullNameSchema>;

export const Route = createFileRoute("/dashboard/settings/general")({
  component: GeneralSettings,
});

function GeneralSettings() {
  const { user } = useUser();
  const { updateName, updateAvatar } = useUserMutation();
  const trpcClient = useTRPCClient();
  const [isUploading, setIsUploading] = useState(false);

  const { firstName, lastName } = parseName(user.name);

  const nameForm = useForm<FullNameInput>({
    resolver: zodResolver(fullNameSchema),
    defaultValues: { firstName, lastName },
  });

  const onSubmitName = async (data: FullNameInput) => {
    const fullName = [capitalize(data.firstName.trim()), capitalize(data.lastName.trim())]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (!fullName || fullName === user.name.trim()) {
      return;
    }
    try {
      await updateName.mutateAsync({ name: fullName });
      toastManager.add({ title: "Name updated", type: "success" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Couldn't update name. Please try again.";
      toastManager.add({ title: "Failed to update name", description: message, type: "error" });
      nameForm.reset({ firstName, lastName });
    }
  };

  const onCropComplete = async (blob: Blob, fileName: string) => {
    setIsUploading(true);
    try {
      const signedParams = await trpcClient.storage.signUpload.mutate({
        folder: "user_avatars",
        entityType: "user",
        entityId: user.id,
      });

      const file = new File([blob], fileName, { type: blob.type });
      const result = await uploadFile({ file, signedParams });

      await trpcClient.storage.saveAsset.mutate({
        publicId: result.publicId,
        secureUrl: result.secureUrl,
        folder: "user_avatars",
        entityType: "user",
        entityId: user.id,
        resourceType: result.resourceType,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        name: fileName,
      });

      // Do not optimistically patch avatar: only update UI after storage + profile writes complete.
      await updateAvatar.mutateAsync({ publicId: result.publicId });
      toastManager.add({ title: "Avatar updated", type: "success" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Couldn't upload avatar. Please try again.";
      toastManager.add({ title: "Upload failed", description: message, type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-4 p-6">
          <AvatarUploaderUI
            currentImagePublicId={user.image}
            isUploading={isUploading}
            name={user.name}
            onCropComplete={onCropComplete}
          />
          <div>
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </Card>

      <Card>
        <Form {...nameForm}>
          <form onSubmit={nameForm.handleSubmit(async (data) => await onSubmitName(data))}>
            <CardHeader>
              <CardTitle className="text-sm">Full name</CardTitle>
              <CardDescription className="text-sm">
                Your display name across the platform.
              </CardDescription>
            </CardHeader>
            <CardPanel className="py-0">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={nameForm.control}
                  name="firstName"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel>First name</FieldLabel>
                        <FormControl>
                          <Input autoComplete="given-name" {...field} />
                        </FormControl>
                        <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                      </Field>
                    </FormItem>
                  )}
                />
                <FormField
                  control={nameForm.control}
                  name="lastName"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel>Last name</FieldLabel>
                        <FormControl>
                          <Input autoComplete="family-name" {...field} />
                        </FormControl>
                        <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                      </Field>
                    </FormItem>
                  )}
                />
              </div>
            </CardPanel>
            <CardFooter className="justify-end pt-0">
              <Button loading={nameForm.formState.isSubmitting} type="submit" className="w-40">
                Save
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Email address</CardTitle>
          <CardDescription className="text-sm">
            Used for sign-in, notifications, and account recovery. Contact{" "}
            <a href={`mailto:${contacts.support.email.contact}`} className="hover:underline">
              support
            </a>{" "}
            if you need to change your email address.
          </CardDescription>
        </CardHeader>
        <CardPanel className="py-0">
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input disabled readOnly value={user.email} />
          </Field>
        </CardPanel>
        <CardFooter className="justify-end">
          <Button disabled type="button" className="w-40">
            Save
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
