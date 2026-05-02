"use client";

import { Redo2 } from "lucide-react";
import React from "react";

import { Button, type ButtonProps } from "@sycom/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom/components/ui/tooltip";
import { cn } from "@sycom/ui/lib/utils";
import { useToolbar } from "./toolbar-provider";

const RedoToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const { editor } = useToolbar();

    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 p-0 sm:h-9 sm:w-9", className)}
              onClick={(e) => {
                editor?.chain().focus().redo().run();
                onClick?.(e);
              }}
              disabled={!editor?.can().chain().focus().redo().run()}
              ref={ref}
              {...props}
            />
          }
        >
          {children ?? <Redo2 className="h-4 w-4" />}
        </TooltipTrigger>
        <TooltipContent>
          <span>Redo</span>
        </TooltipContent>
      </Tooltip>
    );
  },
);

RedoToolbar.displayName = "RedoToolbar";

export { RedoToolbar };
