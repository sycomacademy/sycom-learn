"use client";

import { mergeCertificatePdfPayload } from "@sycom/certificates/course-settings";
import type { CertificatePdfPayload } from "@sycom/certificates";
import { lazy, Suspense, useMemo, useState } from "react";

import { useUser } from "@/hooks/use-user";
import { useTRPCClient } from "@/lib/trpc/client";
import { Button } from "@sycom/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@sycom/ui/components/collapsible";
import { Spinner } from "@sycom/ui/components/spinner";
import { toastManager } from "@sycom/ui/components/toast";
import { ChevronDownIcon, ChevronRightIcon, DownloadIcon } from "lucide-react";
import type { AppRouterOutputs } from "server/trpc/routers/_app";

const CertificatePreviewLazy = lazy(() =>
  import("@sycom/certificates/preview").then((m) => ({ default: m.CertificatePreview })),
);

export type CatalogCertificatePreviewProps = {
  courseId: string;
  courseTitle: string;
  certificateSettings: AppRouterOutputs["catalog"]["get"]["certificateSettings"];
  completed: boolean;
  certificateId: string | null;
};

export function CatalogCertificatePreview({
  courseId,
  courseTitle,
  certificateSettings,
  completed,
  certificateId,
}: CatalogCertificatePreviewProps) {
  const {
    data: { user },
  } = useUser();
  const trpcClient = useTRPCClient();
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const preview = useMemo(() => {
    const issue: CertificatePdfPayload = {
      recipientName: user.name?.trim() || user.email || "Learner",
      courseTitle,
      certificateNumber: "PREVIEW",
      issuedAt: new Date(),
    };
    return mergeCertificatePdfPayload(certificateSettings, issue);
  }, [certificateSettings, courseTitle, user.email, user.name]);

  const onDownload = async () => {
    if (!completed || !certificateId) {
      return;
    }
    setDownloading(true);
    try {
      const result = await trpcClient.catalog.certificatePdf.query({ courseId });
      const binary = Uint8Array.from(atob(result.base64), (ch) => ch.charCodeAt(0));
      const blob = new Blob([binary], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.fileName;
      anchor.click();
      URL.revokeObjectURL(url);
      toastManager.add({
        title: "Download started",
        description: "Your certificate PDF should begin downloading.",
        type: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Couldn't download certificate. Try again.";
      toastManager.add({
        title: "Download failed",
        description: message,
        type: "error",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card shadow-xs/5">
      <Collapsible onOpenChange={setOpen} open={open}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-2 text-left font-medium">
            {open ? (
              <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
            )}
            Preview certificate
          </CollapsibleTrigger>
          {completed && certificateId ? (
            <Button
              disabled={downloading}
              loading={downloading}
              onClick={() => void onDownload()}
              size="sm"
              type="button"
              variant="outline"
            >
              <DownloadIcon className="size-4" />
              Download
            </Button>
          ) : null}
        </div>
        <CollapsibleContent>
          <div className="h-[min(520px,70vh)] w-full p-2">
            {open ? (
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Spinner className="size-8" />
                  </div>
                }
              >
                <CertificatePreviewLazy
                  className="min-h-[480px] rounded-md bg-muted/30"
                  payload={preview.payload}
                  templateId={preview.templateId}
                />
              </Suspense>
            ) : null}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
