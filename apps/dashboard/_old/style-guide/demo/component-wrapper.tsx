"use client";

import { EyeIcon } from "lucide-react";
import type { Route } from "next";
import React from "react";
import { Link } from "@/components/layout/foresight-link";
import { cn } from "@/packages/utils/cn";
import { createLoggerWithContext } from "@/packages/utils/logger";

const logger = createLoggerWithContext("style-guide:demo:component-wrapper");

export function ComponentWrapper({
  className,
  name,
  slug,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  name: string;
  slug: `/style-guide/${string}`;
}) {
  return (
    <ComponentErrorBoundary name={name}>
      <div
        className={cn(
          "flex w-full scroll-mt-16 flex-col rounded-lg border",
          className
        )}
        data-name={name.toLowerCase()}
        id={name}
        {...props}
      >
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-2 font-medium text-sm">
            {getComponentName(name)}
            <Link href={slug as Route}>
              <EyeIcon size={16} />
            </Link>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-2 p-4">{children}</div>
      </div>
    </ComponentErrorBoundary>
  );
}

class ComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; name: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; name: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("component error", {
      name: this.props.name,
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-500">
          Something went wrong in component: {this.props.name}
        </div>
      );
    }

    return this.props.children;
  }
}

function getComponentName(name: string) {
  // convert kebab-case to title case
  return name.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
