"use client";

import { Field as FieldPrimitive } from "@base-ui/react/field";
import type React from "react";
import { cn } from "@sycom/ui/lib/utils";

export function Field({
  className,
  orientation = "vertical",
  ...props
}: FieldPrimitive.Root.Props & { orientation?: "horizontal" | "vertical" }): React.ReactElement {
  return (
    <FieldPrimitive.Root
      className={cn(
        orientation === "horizontal"
          ? "flex flex-row items-start gap-2"
          : "flex flex-col items-start gap-2",
        className,
      )}
      data-slot="field"
      {...props}
    />
  );
}

export function FieldLabel({
  className,
  ...props
}: FieldPrimitive.Label.Props): React.ReactElement {
  return (
    <FieldPrimitive.Label
      className={cn(
        "inline-flex items-center gap-2 text-base/4.5 font-medium text-foreground sm:text-sm/4 data-disabled:opacity-64",
        className,
      )}
      data-slot="field-label"
      {...props}
    />
  );
}

export function FieldItem({ className, ...props }: FieldPrimitive.Item.Props): React.ReactElement {
  return (
    <FieldPrimitive.Item className={cn("flex", className)} data-slot="field-item" {...props} />
  );
}

export function FieldDescription({
  className,
  ...props
}: FieldPrimitive.Description.Props): React.ReactElement {
  return (
    <FieldPrimitive.Description
      className={cn("text-xs text-muted-foreground", className)}
      data-slot="field-description"
      {...props}
    />
  );
}

export function FieldError({
  className,
  reserveSpace,
  ...props
}: FieldPrimitive.Error.Props & { reserveSpace?: boolean }): React.ReactElement {
  return (
    <FieldPrimitive.Error
      className={cn(
        "text-xs text-destructive-foreground",
        reserveSpace && "min-h-[1.25rem]",
        className,
      )}
      data-slot="field-error"
      {...props}
    />
  );
}

export const FieldControl: typeof FieldPrimitive.Control = FieldPrimitive.Control;
export const FieldValidity: typeof FieldPrimitive.Validity = FieldPrimitive.Validity;

export { FieldPrimitive };
