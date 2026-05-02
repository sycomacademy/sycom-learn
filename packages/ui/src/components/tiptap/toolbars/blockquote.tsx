"use client";

import { TextQuote } from "lucide-react";
import React from "react";

import { Toggle } from "@sycom/ui/components/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom/components/ui/tooltip";
import { cn } from "@sycom/ui/lib/utils";
import { useToolbar, useToolbarEditorState } from "./toolbar-provider";

const BlockquoteToolbar = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Toggle>>(
  ({ className, onClick, children, ...props }, ref) => {
    const { editor } = useToolbar();
    const isActive = useToolbarEditorState((currentEditor) => currentEditor.isActive("blockquote"));
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Toggle
              size="sm"
              className={cn("h-8 w-8 p-0 sm:h-9 sm:w-9", className)}
              pressed={isActive}
              onClick={(e) => {
                editor?.chain().focus().toggleBlockquote().run();
                onClick?.(e);
              }}
              disabled={!editor?.isEditable}
              ref={ref}
              {...props}
            />
          }
        >
          {children ?? <TextQuote className="h-4 w-4" />}
        </TooltipTrigger>
        <TooltipContent>
          <span>Blockquote</span>
        </TooltipContent>
      </Tooltip>
    );
  },
);

BlockquoteToolbar.displayName = "BlockquoteToolbar";

export { BlockquoteToolbar };
