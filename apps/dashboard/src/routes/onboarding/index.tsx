import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@sycom/ui/components/button";
import { Field, FieldError, FieldDescription, FieldLabel } from "@sycom/ui/components/field";
import { Form, FormControl, FormField, FormItem } from "@sycom/ui/components/form";
import { Textarea } from "@sycom/ui/components/textarea";
import { toastManager } from "@sycom/ui/components/toast";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod/mini";

import { Link } from "@/components/layout/foresight-link";
import { BRAND, Image } from "@sycom/ui/image";
import { dashboardHomeRoute } from "@/lib/auth/dashboard-home-route";
import { useUser } from "@/hooks/use-user";
import { useTRPC } from "@/lib/trpc/client";

import { OnboardingFadeSwap } from "@/routes/onboarding/onboarding-motion";

const onboardingBioSchema = z.object({
  bio: z.string().check(z.maxLength(500, "Bio must be 500 characters or fewer")),
});

type OnboardingBioInput = z.infer<typeof onboardingBioSchema>;

export const Route = createFileRoute("/onboarding/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(context.trpc.profile.get.queryOptions());
    const status = await context.queryClient.ensureQueryData(
      context.trpc.onboarding.status.queryOptions(),
    );
    if (!status.needsProfileStep && status.needsOrgOwnerStep) {
      throw redirect({ to: "/onboarding/organization" });
    }
    if (!status.needsProfileStep && !status.needsOrgOwnerStep) {
      throw redirect({ to: dashboardHomeRoute(status.activeOrganizationId) });
    }
    return {};
  },
  head: () => ({
    meta: [{ title: "Welcome | Sycom LMS" }],
  }),
  component: OnboardingProfilePage,
});

function OnboardingProfilePage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const {
    data: { session },
  } = useUser();
  const [step, setStep] = useState(0);

  const homePath = dashboardHomeRoute(session.activeOrganizationId);

  const form = useForm<OnboardingBioInput>({
    resolver: zodResolver(onboardingBioSchema),
    defaultValues: { bio: "" },
  });

  const complete = useMutation(
    trpc.onboarding.completeProfile.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries(trpc.onboarding.status.queryOptions()),
          queryClient.invalidateQueries(trpc.profile.get.queryOptions()),
        ]);
        const next = await queryClient.fetchQuery(trpc.onboarding.status.queryOptions());
        if (next.defaultNextPath === "/onboarding/organization") {
          await navigate({ to: "/onboarding/organization", replace: true });
        } else {
          await navigate({
            to: dashboardHomeRoute(next.activeOrganizationId),
            replace: true,
          });
        }
      },
      onError: (error) => {
        toastManager.add({ title: error.message, type: "error" });
      },
    }),
  );

  const runComplete = async (input: Parameters<typeof complete.mutateAsync>[0]) => {
    await complete.mutateAsync(input);
  };

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-10 px-6 py-10">
      <Link className="flex items-center gap-2" to={homePath}>
        <div className="flex size-16 items-center justify-center rounded-lg bg-primary">
          <Image
            alt="Sycom Solutions logo"
            className="rounded object-contain"
            height={80}
            src={BRAND.LOGO}
            width={80}
          />
        </div>
      </Link>

      <p className="text-xs tracking-wide text-muted-foreground uppercase">Step {step + 1} of 2</p>

      <OnboardingFadeSwap className="w-full max-w-md" stepKey={step}>
        {step === 0 ? (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold tracking-tight">Welcome to Sycom</h1>
              <p className="text-sm text-muted-foreground">
                Take a minute to personalize your profile, or skip and do it later in settings.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                variant="outline"
                className="min-w-32"
                disabled={complete.isPending}
                type="button"
                onClick={() => {
                  void runComplete({ skip: true });
                }}
              >
                Skip
              </Button>
              <Button
                className="min-w-32"
                type="button"
                onClick={() => {
                  setStep(1);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="w-full space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Your bio</h1>
              <p className="text-sm text-muted-foreground">
                A short introduction helps instructors and collaborators recognize you.
              </p>
            </div>

            <Form {...form} className="w-full">
              <form
                className="flex w-full flex-col gap-6"
                onSubmit={form.handleSubmit(async (data) => {
                  await runComplete({ bio: data.bio.trim() });
                })}
              >
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel className="text-xs text-muted-foreground">Bio</FieldLabel>
                        <FieldDescription className="text-xs">
                          Optional — up to 500 characters.
                        </FieldDescription>
                        <FormControl>
                          <Textarea
                            autoComplete="off"
                            className="min-h-28"
                            placeholder="e.g., SOC analyst and instructor focused on threat detection, incident response, and hands-on blue team labs."
                            {...field}
                          />
                        </FormControl>
                        <FieldError reserveSpace>{fieldState.error?.message}</FieldError>
                      </Field>
                    </FormItem>
                  )}
                />

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setStep(0);
                    }}
                  >
                    Back
                  </Button>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      type="button"
                      loading={complete.isPending}
                      onClick={() => {
                        void runComplete({ skip: true });
                      }}
                    >
                      Skip
                    </Button>
                    <Button loading={complete.isPending} type="submit">
                      Finish
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        )}
      </OnboardingFadeSwap>
    </div>
  );
}
