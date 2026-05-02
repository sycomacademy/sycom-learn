"use client";
/* eslint-disable */
// @ts-nocheck
import { Trash2, X } from "lucide-react";

import React, { type FormEvent } from "react";

import { Button, type ButtonProps } from "@sycom/components/ui/button";
import { Input } from "@sycom/components/ui/input";
import { Label } from "@sycom/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom/components/ui/tooltip";
import { cn } from "@sycom/ui/lib/utils";

import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@sycom/components/ui/popover";
import { useToolbar } from "./toolbar-provider";
import { getUrlFromString } from "@sycom/lib/tiptap-utils";

const LinkToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    const { editor } = useToolbar();
    const [link, setLink] = React.useState("");

    const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      const url = getUrlFromString(link);
      url && editor?.chain().focus().setLink({ href: url }).run();
    };

    React.useEffect(() => {
      setLink(editor?.getAttributes("link").href ?? "");
    }, [editor]);

    return (
      <Popover>
        <Tooltip>
          <TooltipTrigger
            render={
              <PopoverTrigger
                disabled={!editor?.can().chain().setLink({ href: "" }).run()}
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-max px-3 font-normal",
                      editor?.isActive("link") && "bg-accent",
                      className,
                    )}
                    ref={ref}
                    {...props}
                  />
                }
              />
            }
          >
            <p className="mr-2 text-base">↗</p>
            <p className={"decoration-gray-7 underline underline-offset-4"}>Link</p>
          </TooltipTrigger>
          <TooltipContent>
            <span>Link</span>
          </TooltipContent>
        </Tooltip>

        <PopoverContent className="relative px-3 py-2.5" render={<div className="relative" />}>
          <PopoverClose className="absolute top-3 right-3">
            <X className="h-4 w-4" />
          </PopoverClose>
          <form onSubmit={handleSubmit}>
            <Label>Link</Label>
            <p className="text-gray-11 text-sm">Attach a link to the selected text</p>
            <div className="mt-3 flex flex-col items-end justify-end gap-3">
              <Input
                value={link}
                onChange={(e) => {
                  setLink(e.target.value);
                }}
                className="w-full"
                placeholder="https://example.com"
              />
              <div className="flex items-center gap-3">
                {editor?.getAttributes("link").href && (
                  <Button
                    type="reset"
                    size="sm"
                    className="text-gray-11 h-8"
                    variant="ghost"
                    onClick={() => {
                      editor?.chain().focus().unsetLink().run();
                      setLink("");
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                )}
                <Button size="sm" className="h-8">
                  {editor?.getAttributes("link").href ? "Update" : "Confirm"}
                </Button>
              </div>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    );
  },
);

LinkToolbar.displayName = "LinkToolbar";

export { LinkToolbar };
