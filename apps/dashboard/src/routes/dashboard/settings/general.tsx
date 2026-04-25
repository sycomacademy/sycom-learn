import { zodResolver } from "@hookform/resolvers/zod";
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
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";

import { contacts } from "@sycom/ui/lib/constants";
import { useUser } from "@/hooks/use-user";
import { authClient } from "@/lib/auth/auth-client";
import { useTRPC } from "@/lib/trpc/client";
import { capitalize, parseName } from "@sycom/ui/lib/string";
import { AvatarUploader } from "@/components/dashboard/settings/avatar-uploader";

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
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { firstName, lastName } = parseName(user.name);

  const nameForm = useForm<FullNameInput>({
    resolver: zodResolver(fullNameSchema),
    defaultValues: { firstName, lastName },
  });

  const onSubmitName = async (data: FullNameInput) => {
    try {
      const fullName = [capitalize(data.firstName.trim()), capitalize(data.lastName.trim())]
        .filter(Boolean)
        .join(" ")
        .trim();
      if (!fullName) {
        return;
      }
      if (fullName === user.name.trim()) {
        return;
      }
      const { error } = await authClient.updateUser({ name: fullName });
      if (error) {
        toastManager.add({ title: error.message, type: "error" });
        return;
      }
      await queryClient.invalidateQueries({ queryKey: trpc.profile.get.queryKey() });
      toastManager.add({ title: "Name updated", type: "success" });
    } catch (error) {
      if (error instanceof Error) {
        toastManager.add({ title: error.message, type: "error" });
        return;
      }
      toastManager.add({
        title: "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-4 p-6">
          <AvatarUploader user={user} />
          <div>
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </Card>

      <Card>
        <Form {...nameForm}>
          <form onSubmit={nameForm.handleSubmit(onSubmitName)}>
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
