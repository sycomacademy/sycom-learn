"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import React, { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { anchoredToastManager, toastManager } from "@/components/ui/toast";
import { createLoggerWithContext } from "@/packages/utils/logger";

const log = createLoggerWithContext("sonner-demo");

const allTypes = [
  {
    name: "Default",
    snippet: `toast('Event has been created')`,
    action: () => toastManager.add({ title: "Event has been created" }),
  },
  {
    name: "Description",
    snippet: `toast.message('Event has been created', {
  description: 'Monday, January 3rd at 6:00pm',
})`,
    action: () =>
      toastManager.add({
        title: "Event has been created",
        description: "Monday, January 3rd at 6:00pm",
      }),
  },
  {
    name: "Success",
    snippet: `toast.success('Event has been created')`,
    action: () =>
      toastManager.add({ title: "Event has been created", type: "success" }),
  },
  {
    name: "Info",
    snippet: `toast.info('Be at the area 10 minutes before the event time')`,
    action: () =>
      toastManager.add({
        title: "Be at the area 10 minutes before the event time",
        type: "info",
      }),
  },
  {
    name: "Warning",
    snippet: `toast.warning('Event start time cannot be earlier than 8am')`,
    action: () =>
      toastManager.add({
        title: "Event start time cannot be earlier than 8am",
        type: "warning",
      }),
  },
  {
    name: "Error",
    snippet: `toast.error('Event has not been created')`,
    action: () =>
      toastManager.add({ title: "Event has not been created", type: "error" }),
  },
  {
    name: "Action",
    action: () =>
      toastManager.add({
        title: "Event has been created",
        description: "Undo",
        actionProps: {
          children: "Undo",
          onClick: () => log.info("Undo clicked"),
        },
      }),
  },
  {
    name: "Cancel",
    action: () =>
      toastManager.add({
        title: "Event has been created",
        description: "Cancel",
        actionProps: {
          children: "Cancel",
          onClick: () => log.info("Cancel clicked"),
        },
      }),
  },
  {
    name: "Promise",
    action: () =>
      toastManager.promise<{ name: string }>(
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({ name: "Sonner" });
          }, 2000);
        }),
        {
          loading: "Loading...",
          success: (data) => {
            return `${data.name} toast has been added`;
          },
          error: "Error",
        }
      ),
  },
];

function CopyButtonWithAnchoredToast() {
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const toastTimeout = 2000;

  async function handleCopy() {
    const url = "https://coss.com";
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      if (copyButtonRef.current) {
        anchoredToastManager.add({
          data: { tooltipStyle: true },
          positionerProps: { anchor: copyButtonRef.current },
          timeout: toastTimeout,
          title: "Copied!",
        });
      }
      log.info("Copied to clipboard", { url });
    } catch (err) {
      log.error("Failed to copy", { error: err });
    } finally {
      setTimeout(() => setIsCopied(false), toastTimeout);
    }
  }

  return (
    <Button
      aria-label="Copy link"
      disabled={isCopied}
      onClick={handleCopy}
      ref={copyButtonRef}
      size="icon"
      variant="outline"
    >
      {isCopied ? (
        <CheckIcon className="size-4" />
      ) : (
        <CopyIcon className="size-4" />
      )}
    </Button>
  );
}

function SubmitButtonWithErrorToast() {
  const submitRef = useRef<HTMLButtonElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toastIdRef = useRef<string | null>(null);

  function handleSubmit() {
    if (!submitRef.current || isSubmitting) {
      return;
    }

    if (toastIdRef.current) {
      anchoredToastManager.close(toastIdRef.current);
      toastIdRef.current = null;
    }

    setIsSubmitting(true);
    log.info("Submit started");

    new Promise<void>((_, reject) => {
      setTimeout(() => {
        setIsSubmitting(false);
        reject(
          new Error("The server is not responding. Please try again later.")
        );
      }, 2000);
    }).catch((error: Error) => {
      log.info("Submit failed", { message: error.message });
      toastIdRef.current = anchoredToastManager.add({
        description: error.message,
        positionerProps: {
          anchor: submitRef.current,
          sideOffset: 4,
        },
        title: "Error submitting form",
        type: "error",
      });
    });
  }

  return (
    <Button
      disabled={isSubmitting}
      onClick={handleSubmit}
      ref={submitRef}
      variant="outline"
    >
      {isSubmitting ? (
        <>
          <Spinner className="size-4" />
          Submitting…
        </>
      ) : (
        "Submit (simulated failure)"
      )}
    </Button>
  );
}

export function SonnerDemo() {
  const [activeType, setActiveType] = React.useState(allTypes[0]);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={() =>
            toastManager.add({
              description: "Sunday, December 03, 2023 at 9:00 AM",
              title: "Event has been created",
              actionProps: {
                children: "Undo",
                onClick: () => log.info("Undo clicked"),
              },
            })
          }
          variant="outline"
        >
          Show Toast
        </Button>
        {allTypes.map((type) => (
          <Button
            data-active={activeType.name === type.name}
            key={type.name}
            onClick={() => {
              type.action();
              setActiveType(type);
            }}
            variant="ghost"
          >
            {type.name}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 border-border border-t pt-4">
        <span className="text-muted-foreground text-sm">Anchored toasts:</span>
        <div className="flex items-center gap-2">
          <CopyButtonWithAnchoredToast />
          <span className="text-muted-foreground text-xs">Copy link</span>
        </div>
        <SubmitButtonWithErrorToast />
      </div>
    </div>
  );
}
