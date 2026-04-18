"use client";

import { Toast } from "@base-ui/react/toast";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
} from "lucide-react";
import type React from "react";

import { cn } from "@sycom/ui/lib/utils";

import { buttonVariants } from "./button-variants";

const TOAST_ICONS = {
  error: CircleAlertIcon,
  info: InfoIcon,
  loading: LoaderCircleIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
} as const;

type ToastType = keyof typeof TOAST_ICONS;

type SwipeDirection = "up" | "down" | "left" | "right";

function getSwipeDirection(position: ToastPosition): SwipeDirection[] {
  const verticalDirection: SwipeDirection = position.startsWith("top") ? "up" : "down";
  if (position.includes("center")) return [verticalDirection];
  if (position.includes("left")) return ["left", verticalDirection];
  return ["right", verticalDirection];
}

function upsertReplayClassName(toast: { type?: string; updateKey?: number }): string | undefined {
  const k = toast.updateKey ?? 0;
  if (k <= 0) return undefined;
  const isEven = k % 2 === 0;
  if (toast.type === "error") {
    return isEven ? "animate-toast-error-even" : "animate-toast-error-odd";
  }
  return isEven ? "animate-toast-success-even" : "animate-toast-success-odd";
}

function Toasts({ position }: { position: ToastPosition }): React.ReactElement {
  const { toasts } = Toast.useToastManager();
  const swipeDirection = getSwipeDirection(position);

  return (
    <Toast.Portal data-slot="toast-portal">
      <Toast.Viewport
        className={cn(
          "fixed z-60 mx-auto flex w-[calc(100%-var(--toast-inset)*2)] max-w-90 [--toast-inset:--spacing(4)] sm:[--toast-inset:--spacing(8)]",
          "data-[position*=top]:top-(--toast-inset)",
          "data-[position*=bottom]:bottom-(--toast-inset)",
          "data-[position*=left]:left-(--toast-inset)",
          "data-[position*=right]:right-(--toast-inset)",
          "data-[position*=center]:left-1/2 data-[position*=center]:-translate-x-1/2",
        )}
        data-position={position}
        data-slot="toast-viewport"
      >
        {toasts.map((toast) => {
          const Icon = toast.type ? TOAST_ICONS[toast.type as ToastType] : null;

          return (
            <Toast.Root
              key={toast.id}
              className={cn(
                "absolute z-[calc(9999-var(--toast-index))] h-(--toast-calc-height) w-full rounded-lg border bg-[color-mix(in_srgb,var(--popover),var(--color-black)_calc(1%*max(0,var(--toast-index,0))))] text-popover-foreground shadow-lg/5 select-none [transition:transform_.5s_cubic-bezier(.22,1,.36,1),opacity_.5s,height_.15s,background-color_.5s] not-dark:bg-clip-padding before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] before:shadow-[0_1px_--theme(--color-black/4%)] data-expanded:bg-popover dark:bg-[color-mix(in_srgb,var(--popover),var(--color-black)_calc(6%*max(0,var(--toast-index,0))))] dark:before:shadow-[0_-1px_--theme(--color-white/6%)] dark:data-expanded:bg-popover",
                "data-[position*=right]:right-0 data-[position*=right]:left-auto",
                "data-[position*=left]:right-auto data-[position*=left]:left-0",
                "data-[position*=center]:right-0 data-[position*=center]:left-0",
                "data-[position*=top]:top-0 data-[position*=top]:bottom-auto data-[position*=top]:origin-[50%_calc(50%-50%*min(var(--toast-index,0),1))]",
                "data-[position*=bottom]:top-auto data-[position*=bottom]:bottom-0 data-[position*=bottom]:origin-[50%_calc(50%+50%*min(var(--toast-index,0),1))]",
                "after:absolute after:left-0 after:h-[calc(var(--toast-gap)+1px)] after:w-full",
                "data-[position*=top]:after:top-full",
                "data-[position*=bottom]:after:bottom-full",
                "[--toast-calc-height:var(--toast-frontmost-height,var(--toast-height))] [--toast-gap:--spacing(3)] [--toast-peek:--spacing(3)] [--toast-scale:calc(max(0,1-(var(--toast-index)*.1)))] [--toast-shrink:calc(1-var(--toast-scale))]",
                "data-[position*=top]:[--toast-calc-offset-y:calc(var(--toast-offset-y)+var(--toast-index)*var(--toast-gap)+var(--toast-swipe-movement-y))]",
                "data-[position*=bottom]:[--toast-calc-offset-y:calc(var(--toast-offset-y)*-1+var(--toast-index)*var(--toast-gap)*-1+var(--toast-swipe-movement-y))]",
                "data-[position*=top]:transform-[translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+(var(--toast-index)*var(--toast-peek))+(var(--toast-shrink)*var(--toast-calc-height))))_scale(var(--toast-scale))]",
                "data-[position*=bottom]:transform-[translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--toast-peek))-(var(--toast-shrink)*var(--toast-calc-height))))_scale(var(--toast-scale))]",
                "data-limited:opacity-0",
                "data-expanded:h-(--toast-height)",
                "data-position:data-expanded:transform-[translateX(var(--toast-swipe-movement-x))_translateY(var(--toast-calc-offset-y))]",
                "data-[position*=top]:data-starting-style:transform-[translateY(calc(-100%-var(--toast-inset)))]",
                "data-[position*=bottom]:data-starting-style:transform-[translateY(calc(100%+var(--toast-inset)))]",
                "data-ending-style:opacity-0",
                "data-ending-style:not-data-limited:not-data-swipe-direction:transform-[translateY(calc(100%+var(--toast-inset)))]",
                "data-ending-style:data-[swipe-direction=left]:transform-[translateX(calc(var(--toast-swipe-movement-x)-100%-var(--toast-inset)))_translateY(var(--toast-calc-offset-y))]",
                "data-ending-style:data-[swipe-direction=right]:transform-[translateX(calc(var(--toast-swipe-movement-x)+100%+var(--toast-inset)))_translateY(var(--toast-calc-offset-y))]",
                "data-ending-style:data-[swipe-direction=up]:transform-[translateY(calc(var(--toast-swipe-movement-y)-100%-var(--toast-inset)))]",
                "data-ending-style:data-[swipe-direction=down]:transform-[translateY(calc(var(--toast-swipe-movement-y)+100%+var(--toast-inset)))]",
                "data-expanded:data-ending-style:data-[swipe-direction=left]:transform-[translateX(calc(var(--toast-swipe-movement-x)-100%-var(--toast-inset)))_translateY(var(--toast-calc-offset-y))]",
                "data-expanded:data-ending-style:data-[swipe-direction=right]:transform-[translateX(calc(var(--toast-swipe-movement-x)+100%+var(--toast-inset)))_translateY(var(--toast-calc-offset-y))]",
                "data-expanded:data-ending-style:data-[swipe-direction=up]:transform-[translateY(calc(var(--toast-swipe-movement-y)-100%-var(--toast-inset)))]",
                "data-expanded:data-ending-style:data-[swipe-direction=down]:transform-[translateY(calc(var(--toast-swipe-movement-y)+100%+var(--toast-inset)))]",
                upsertReplayClassName(toast),
              )}
              data-position={position}
              swipeDirection={swipeDirection}
              toast={toast}
            >
              <Toast.Content className="pointer-events-auto flex items-center justify-between gap-1.5 overflow-hidden px-3.5 py-3 text-sm transition-opacity duration-250 data-behind:opacity-0 data-behind:not-data-expanded:pointer-events-none data-expanded:opacity-100">
                <div className="flex gap-2">
                  {Icon && (
                    <div
                      className="[&_svg]:pointer-events-none [&_svg]:shrink-0 [&>svg]:h-lh [&>svg]:w-4"
                      data-slot="toast-icon"
                    >
                      <Icon className="in-data-[type=error]:text-destructive in-data-[type=info]:text-info in-data-[type=loading]:animate-spin in-data-[type=loading]:opacity-80 in-data-[type=success]:text-success in-data-[type=warning]:text-warning" />
                    </div>
                  )}

                  <div className="flex flex-col gap-0.5">
                    <Toast.Title className="font-medium" data-slot="toast-title" />
                    <Toast.Description
                      className="text-muted-foreground"
                      data-slot="toast-description"
                    />
                  </div>
                </div>
                {toast.actionProps && (
                  <Toast.Action className={buttonVariants({ size: "xs" })} data-slot="toast-action">
                    {toast.actionProps.children}
                  </Toast.Action>
                )}
              </Toast.Content>
            </Toast.Root>
          );
        })}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

export const toastManager: ReturnType<typeof Toast.createToastManager> = Toast.createToastManager();

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface ToastProviderProps extends Omit<Toast.Provider.Props, "toastManager"> {
  position?: ToastPosition;
}

export function ToastProvider({
  children,
  position = "bottom-right",
  ...props
}: ToastProviderProps): React.ReactElement {
  return (
    <Toast.Provider toastManager={toastManager} {...props}>
      {children}
      <Toasts position={position} />
    </Toast.Provider>
  );
}

export { Toast as ToastPrimitive };

interface ToastAction {
  label: React.ReactNode;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export interface ToastOptions {
  id?: string;
  description?: React.ReactNode;
  duration?: number;
  action?: ToastAction;
  onDismiss?: () => void;
  onAutoClose?: () => void;
}

function toActionProps(action?: ToastAction) {
  if (!action) return undefined;
  return { children: action.label, onClick: action.onClick };
}

function buildAddOptions(
  title: React.ReactNode,
  type: ToastType | undefined,
  options?: ToastOptions,
) {
  return {
    id: options?.id,
    title,
    type,
    description: options?.description,
    timeout: options?.duration,
    actionProps: toActionProps(options?.action),
    onClose: options?.onDismiss,
    onRemove: options?.onAutoClose,
  };
}

function baseToast(title: React.ReactNode, options?: ToastOptions): string {
  return toastManager.add(buildAddOptions(title, undefined, options));
}

type PromiseMessage<Value> = string | ((value: Value) => string);
type PromiseErrorMessage = string | ((error: unknown) => string);

interface PromiseOptions<Value> {
  loading: string;
  success: PromiseMessage<Value>;
  error: PromiseErrorMessage;
}

function resolveMessage<Value>(
  message: PromiseMessage<Value> | PromiseErrorMessage,
  value: Value,
): string {
  return typeof message === "function" ? (message as (v: Value) => string)(value) : message;
}

export const toast = Object.assign(baseToast, {
  message: (title: React.ReactNode, options?: ToastOptions): string =>
    toastManager.add(buildAddOptions(title, undefined, options)),
  success: (title: React.ReactNode, options?: ToastOptions): string =>
    toastManager.add(buildAddOptions(title, "success", options)),
  error: (title: React.ReactNode, options?: ToastOptions): string =>
    toastManager.add(buildAddOptions(title, "error", options)),
  info: (title: React.ReactNode, options?: ToastOptions): string =>
    toastManager.add(buildAddOptions(title, "info", options)),
  warning: (title: React.ReactNode, options?: ToastOptions): string =>
    toastManager.add(buildAddOptions(title, "warning", options)),
  loading: (title: React.ReactNode, options?: ToastOptions): string =>
    toastManager.add(buildAddOptions(title, "loading", options)),
  dismiss: (id?: string): void => toastManager.close(id),
  promise<Value>(promise: Promise<Value>, options: PromiseOptions<Value>): Promise<Value> {
    return toastManager.promise(promise, {
      loading: { title: options.loading, type: "loading", timeout: 0 },
      success: (value) => ({
        title: resolveMessage(options.success, value),
        type: "success",
      }),
      error: (err) => ({
        title: resolveMessage(options.error, err),
        type: "error",
      }),
    });
  },
});
