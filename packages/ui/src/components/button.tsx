import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type * as React from "react";
import { Spinner } from "@sycom/ui/components/spinner";
import { cn } from "@sycom/ui/lib/utils";
import { type VariantProps } from "class-variance-authority";

import { buttonVariants } from "./button-variants";

interface ButtonProps
  extends useRender.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}
function Button({
  className,
  variant,
  size,
  render,
  loading = false,
  disabled: disabledProp,
  children,
  ...props
}: ButtonProps): React.ReactElement {
  const isDisabled = Boolean(loading || disabledProp);
  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] = render
    ? undefined
    : "button";

  const defaultProps = {
    children: (
      <>
        {loading ? <Spinner data-icon="inline-start" data-slot="button-loading-indicator" /> : null}
        {children}
      </>
    ),
    className: cn(buttonVariants({ variant, size, className })),
    "aria-disabled": loading || undefined,
    "data-loading": loading ? "" : undefined,
    "data-slot": "button",
    disabled: isDisabled,
    type: typeValue,
  };

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  });
}

export { Button };
