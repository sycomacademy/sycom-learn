"use client";

import { Image } from "lucide-react";
import React from "react";

import { Button, type ButtonProps } from "@sycom/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom/components/ui/tooltip";
import { cn } from "@sycom/ui/lib/utils";
import { useToolbar, useToolbarEditorState } from "./toolbar-provider";

const ImagePlaceholderToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const { editor } = useToolbar();
    const isActive = useToolbarEditorState((currentEditor) =>
      currentEditor.isActive("image-placeholder"),
    );
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 p-0 sm:h-9 sm:w-9",
                isActive && "bg-accent text-accent-foreground",
                className,
              )}
              onClick={(e) => {
                e.preventDefault();
                editor?.chain().focus().insertImagePlaceholder().run();
                onClick?.(e);
              }}
              ref={ref}
              {...props}
            />
          }
        >
          {children ?? <Image className="h-4 w-4" />}
        </TooltipTrigger>
        <TooltipContent>
          <span>Image</span>
        </TooltipContent>
      </Tooltip>
    );
  },
);

ImagePlaceholderToolbar.displayName = "ImagePlaceholderToolbar";

export { ImagePlaceholderToolbar };
