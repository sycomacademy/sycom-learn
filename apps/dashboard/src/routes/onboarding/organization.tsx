import { uploadFile } from "@sycom/storage/client";
import { Avatar, AvatarFallback, AvatarImage } from "@sycom/ui/components/avatar";
import { Button } from "@sycom/ui/components/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@sycom/ui/components/dialog";
import { Input } from "@sycom/ui/components/input";
import { toastManager } from "@sycom/ui/components/toast";
import { buildImageUrl } from "@sycom/ui/image/cdn";
import { BRAND, Image } from "@sycom/ui/image";
import { getInitials } from "@sycom/ui/lib/string";
import { cn } from "@sycom/ui/lib/utils";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { Link } from "@/components/layout/foresight-link";
import { dashboardHomeRoute } from "@/lib/auth/dashboard-home-route";
import { useUser } from "@/hooks/use-user";
import { ORG_ACCENT_PRESETS, ORG_BRAND_PRIMARY_HEX } from "@/routes/onboarding/-org-brand-presets";
import { OnboardingFadeSwap } from "@/routes/onboarding/-onboarding-motion";
import { useTRPC, useTRPCClient } from "@/lib/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/onboarding/organization")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(context.trpc.profile.get.queryOptions());
    const status = await context.queryClient.ensureQueryData(
      context.trpc.onboarding.status.queryOptions(),
    );
    if (status.needsProfileStep) {
      throw redirect({ to: "/onboarding" });
    }
    if (!status.needsOrgOwnerStep) {
      throw redirect({ to: dashboardHomeRoute(status.activeOrganizationId) });
    }
    return context.queryClient.ensureQueryData(
      context.trpc.onboarding.organizationContext.queryOptions(),
    );
  },
  head: () => ({
    meta: [{ title: "Organization setup | Sycom LMS" }],
  }),
  component: OnboardingOrganizationPage,
});

function OnboardingOrganizationPage() {
  const orgCtx = Route.useLoaderData();
  const {
    data: { session },
  } = useUser();
  const homePath = dashboardHomeRoute(session.activeOrganizationId);
  const { organizationId, name, slug, logoPublicId: initialLogoPublicId } = orgCtx;

  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedLogoPublicId, setUploadedLogoPublicId] = useState<string | null>(null);
  const [uploadPending, setUploadPending] = useState(false);
  const [selectedAccentHex, setSelectedAccentHex] = useState<string>(ORG_BRAND_PRIMARY_HEX);
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);

  useEffect(() => {
    if (!pickedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pickedFile);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pickedFile]);

  const displayLogoSrc =
    previewUrl ?? (!pickedFile && initialLogoPublicId ? buildImageUrl(initialLogoPublicId) : null);

  const complete = useMutation(
    trpc.onboarding.completeOrganization.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries(trpc.onboarding.status.queryOptions()),
          queryClient.invalidateQueries(trpc.profile.get.queryOptions()),
          queryClient.invalidateQueries(trpc.onboarding.organizationContext.queryOptions()),
        ]);
        toastManager.add({ title: "Organization setup complete", type: "success" });
        const st = await queryClient.fetchQuery(trpc.onboarding.status.queryOptions());
        await navigate({
          to: dashboardHomeRoute(st.activeOrganizationId),
          replace: true,
        });
      },
      onError: (error) => {
        toastManager.add({ title: error.message, type: "error" });
      },
    }),
  );

  const finishWithLogoOnStepAdvance = async (): Promise<boolean> => {
    if (!pickedFile) {
      setStep(2);
      return true;
    }
    setUploadPending(true);
    try {
      const signedParams = await trpcClient.storage.signUpload.mutate({
        folder: "organization_logos",
        entityType: "organization",
        entityId: organizationId,
      });
      const result = await uploadFile({ file: pickedFile, signedParams });
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
        name: pickedFile.name,
        tags: ["organization-logo"],
      });
      setUploadedLogoPublicId(result.publicId);
      setPickedFile(null);
      setStep(2);
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Couldn't upload logo. Please try again.";
      toastManager.add({ title: "Upload failed", description: message, type: "error" });
      return false;
    } finally {
      setUploadPending(false);
    }
  };

  const runSkip = () => {
    complete.mutate({ skipRemaining: true });
  };

  const stepLabel = useMemo(() => {
    switch (step) {
      case 0:
        return "Confirm workspace";
      case 1:
        return "Logo";
      default:
        return "Brand color";
    }
  }, [step]);

  const stepBody =
    step === 0 ? (
      <div className="flex flex-col gap-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Confirm your organization</h1>
          <p className="text-sm text-muted-foreground">
            These match your administrator&apos;s invitation. Contact them if anything looks wrong.
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card px-5 py-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Name</p>
            <p className="text-sm font-medium">{name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Slug</p>
            <p className="font-mono text-sm">{slug}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={() => setSkipDialogOpen(true)}>
            Skip setup
          </Button>
          <Button type="button" onClick={() => setStep(1)}>
            Next
          </Button>
        </div>
      </div>
    ) : step === 1 ? (
      <div className="flex flex-col gap-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Organization logo</h1>
          <p className="text-sm text-muted-foreground">
            PNG or JPG works best. Square images display cleanly across the dashboard.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Avatar className="size-24 rounded-md">
            {displayLogoSrc ? (
              <AvatarImage
                alt={`${name} logo`}
                className="rounded-md object-cover"
                src={displayLogoSrc}
              />
            ) : null}
            <AvatarFallback className="rounded-md text-lg">
              {getInitials(name).slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <Input
            accept="image/*"
            aria-label="Upload organization logo"
            className="max-w-xs cursor-pointer"
            type="file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPickedFile(f ?? null);
            }}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => setStep(0)}>
            Back
          </Button>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={complete.isPending || uploadPending}
              onClick={runSkip}
            >
              Skip
            </Button>
            <Button
              loading={uploadPending}
              type="button"
              onClick={() => void finishWithLogoOnStepAdvance()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    ) : (
      <div className="flex flex-col gap-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Brand accent</h1>
          <p className="text-sm text-muted-foreground">
            Used for subtle highlights across your workspace. Sycom defaults to your palette below.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {ORG_ACCENT_PRESETS.map((p) => (
            <button
              aria-label={p.label}
              aria-pressed={selectedAccentHex === p.hex}
              className={cn(
                "relative size-12 rounded-full border-2 transition-transform",
                selectedAccentHex === p.hex
                  ? "border-foreground ring-2 ring-ring/50 ring-offset-2 ring-offset-background"
                  : "border-transparent",
              )}
              key={p.hex}
              style={{ backgroundColor: p.hex }}
              title={p.label}
              type="button"
              onClick={() => {
                setSelectedAccentHex(p.hex);
              }}
            />
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => setStep(1)}>
            Back
          </Button>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" disabled={complete.isPending} onClick={runSkip}>
              Skip
            </Button>
            <Button
              loading={complete.isPending}
              type="button"
              onClick={() => {
                complete.mutate({
                  accentHex: selectedAccentHex,
                  ...(uploadedLogoPublicId ? { logoPublicId: uploadedLogoPublicId } : {}),
                });
              }}
            >
              Finish
            </Button>
          </div>
        </div>
      </div>
    );

  return (
    <>
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

        <div className="text-center">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            Step {step + 1} of 3
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{stepLabel}</p>
        </div>

        <OnboardingFadeSwap className="w-full max-w-md" stepKey={step}>
          {stepBody}
        </OnboardingFadeSwap>
      </div>

      <Dialog onOpenChange={setSkipDialogOpen} open={skipDialogOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Skip organization setup?</DialogTitle>
            <DialogDescription>
              You can add a logo and brand color later from your dashboard. Your tenant uses
              defaults until then.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter variant="bare">
            <Button type="button" variant="outline" onClick={() => setSkipDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={complete.isPending}
              type="button"
              variant="destructive"
              onClick={() => {
                setSkipDialogOpen(false);
                runSkip();
              }}
            >
              Skip for now
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}
