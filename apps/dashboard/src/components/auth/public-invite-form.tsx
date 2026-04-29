import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2Icon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";

import { Link } from "@/components/layout/foresight-link";
import { useTRPC } from "@/lib/trpc/client";
import { Button } from "@sycom/ui/components/button";
import { buttonVariants } from "@sycom/ui/components/button-variants";
import { Field, FieldError, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@sycom/ui/components/input-group";
import { Spinner } from "@sycom/ui/components/spinner";
import { toastManager } from "@sycom/ui/components/toast";

const acceptInviteSchema = z
  .object({
    password: z.string().check(z.minLength(8, "Password must be at least 8 characters")),
    confirmPassword: z.string(),
  })
  .check(
    z.refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    }),
  );

type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

function InviteState({ description, title }: { description: string; title: string }) {
  return (
    <div className="w-full space-y-4 text-center">
      <div className="space-y-2">
        <h1 className="text-lg font-medium tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Link className={buttonVariants({ variant: "outline" })} to="/sign-in">
        Go to sign in
      </Link>
    </div>
  );
}

export function PublicInviteForm({ token }: { token: string }) {
  const trpc = useTRPC();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const inviteQuery = useQuery(trpc.invite.getByToken.queryOptions({ token }));
  const form = useForm<AcceptInviteInput>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { confirmPassword: "", password: "" },
  });

  const acceptMutation = useMutation({
    ...trpc.invite.accept.mutationOptions({
      onSuccess: async () => {
        toastManager.add({
          title: "Account ready",
          description: "Your invite has been accepted. Sign in to continue.",
          type: "success",
        });
        await router.navigate({ to: "/sign-in", replace: true });
      },
      onError: (error) => {
        toastManager.add({
          title: "Could not accept invite",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  const rejectMutation = useMutation({
    ...trpc.invite.reject.mutationOptions({
      onSuccess: async () => {
        await inviteQuery.refetch();
        toastManager.add({
          title: "Invite declined",
          description: "This invitation has been declined.",
          type: "success",
        });
      },
      onError: (error) => {
        toastManager.add({
          title: "Could not decline invite",
          description: error.message,
          type: "error",
        });
      },
    }),
  });

  const onSubmit = async (data: AcceptInviteInput) => {
    try {
      await acceptMutation.mutateAsync({ password: data.password, token });
    } catch {
      // onError toast already fired by mutation
    }
  };

  if (inviteQuery.isPending) {
    return (
      <div className="flex w-full justify-center py-12">
        <Spinner className="size-5" />
      </div>
    );
  }

  if (inviteQuery.error || !inviteQuery.data) {
    return (
      <InviteState
        description="This invite is invalid or no longer exists. Ask an admin to send a new one."
        title="Invite not found"
      />
    );
  }

  if (inviteQuery.data.status === "accepted") {
    return (
      <InviteState
        description="This invite has already been used. Sign in with your account to continue."
        title="Invite already accepted"
      />
    );
  }

  if (inviteQuery.data.status === "expired") {
    return (
      <InviteState
        description="This invite expired. Ask an admin to send a new one."
        title="Invite expired"
      />
    );
  }

  if (inviteQuery.data.status === "revoked") {
    return (
      <InviteState
        description="This invite has been revoked by an administrator."
        title="Invite revoked"
      />
    );
  }

  if (inviteQuery.data.status === "rejected") {
    return (
      <InviteState
        description="This invite has already been declined. Ask an admin to send a new one if you still need access."
        title="Invite declined"
      />
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2Icon className="size-5" />
        </div>
        <h1 className="text-lg font-medium tracking-tight">Set your password</h1>
        <p className="text-sm text-muted-foreground">
          {inviteQuery.data.inviterName} invited you to join Sycom LMS as{" "}
          {inviteQuery.data.role === "platform_admin"
            ? "an Admin"
            : inviteQuery.data.role === "content_creator"
              ? "a Content Creator"
              : "a Student"}
          . This link expires on {new Date(inviteQuery.data.expiresAt).toLocaleString()}.
        </p>
      </div>

      <Form {...form} className="flex w-full flex-col gap-4">
        <form className="contents" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <Field>
                  <FieldLabel className="text-xs text-muted-foreground">New password</FieldLabel>
                  <FormControl>
                    <InputGroup>
                      <InputGroupInput
                        autoComplete="new-password"
                        placeholder="Min. 8 characters"
                        type={showPassword ? "text" : "password"}
                        {...field}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowPassword((s) => !s)}
                        >
                          {showPassword ? (
                            <EyeOffIcon className="size-3.5" />
                          ) : (
                            <EyeIcon className="size-3.5" />
                          )}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                  </FormControl>
                  <FieldError reserveSpace>
                    {fieldState.error?.message ?? (
                      <span className="text-muted-foreground/70">
                        Tip: mix uppercase, lowercase, and a number for a stronger password.
                      </span>
                    )}
                  </FieldError>
                </Field>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <FormItem>
                <Field>
                  <FieldLabel className="text-xs text-muted-foreground">
                    Confirm password
                  </FieldLabel>
                  <FormControl>
                    <InputGroup>
                      <InputGroupInput
                        autoComplete="new-password"
                        placeholder="Re-enter password"
                        type={showConfirm ? "text" : "password"}
                        {...field}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          aria-label={showConfirm ? "Hide password" : "Show password"}
                          onClick={() => setShowConfirm((s) => !s)}
                        >
                          {showConfirm ? (
                            <EyeOffIcon className="size-3.5" />
                          ) : (
                            <EyeIcon className="size-3.5" />
                          )}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                  </FormControl>
                  <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                </Field>
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1"
              disabled={acceptMutation.isPending}
              loading={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate({ token })}
              type="button"
              variant="outline"
            >
              Decline invite
            </Button>
            <Button
              className="flex-1"
              disabled={rejectMutation.isPending}
              loading={form.formState.isSubmitting}
              type="submit"
            >
              Accept invite
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
