"use client";

import * as React from "react";
import { CircleUserRoundIcon, UploadIcon, XIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@sycom/ui/components/avatar";
import { Button } from "@sycom/ui/components/button";
import { FieldError } from "@sycom/ui/components/field";
import { useFileUpload } from "@sycom/ui/hooks/use-file-upload";
import { cn } from "@sycom/ui/lib/utils";

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;

export type ImageUploadProps = {
  accept?: string;
  alt?: string;
  className?: string;
  description?: React.ReactNode;
  disabled?: boolean;
  fallback?: React.ReactNode;
  maxSize?: number;
  onChange?: (file: File | null) => void;
  previewClassName?: string;
  value?: string | null;
};

export function ImageUpload({
  accept = "image/*",
  alt = "Uploaded image",
  className,
  description,
  disabled = false,
  fallback,
  maxSize = DEFAULT_MAX_SIZE,
  onChange,
  previewClassName,
  value,
}: ImageUploadProps): React.ReactElement {
  const [
    { files, isDragging, errors },
    {
      removeFile,
      openFileDialog,
      getInputProps,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
    },
  ] = useFileUpload({
    accept,
    maxSize,
    onFilesChange(nextFiles) {
      const nextFile = nextFiles[0]?.file;
      onChange?.(nextFile instanceof File ? nextFile : null);
    },
  });

  const selectedFile = files[0];
  const previewUrl = selectedFile?.preview ?? value ?? null;
  const fileName = selectedFile?.file.name;

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      <div className="relative inline-flex">
        <button
          aria-label={previewUrl ? "Change image" : "Upload image"}
          className={cn(
            "group relative rounded-full transition-colors outline-none",
            "focus-visible:ring-[3px] focus-visible:ring-ring/50",
            disabled && "pointer-events-none opacity-50",
          )}
          data-dragging={isDragging || undefined}
          disabled={disabled}
          onClick={openFileDialog}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          type="button"
        >
          <Avatar
            className={cn(
              "size-16 border bg-background text-xs transition-colors",
              previewUrl
                ? "border-transparent"
                : "border-dashed border-input group-hover:bg-accent/50",
              isDragging && "bg-accent/50",
              previewClassName,
            )}
          >
            {previewUrl ? <AvatarImage alt={alt} src={previewUrl} /> : null}
            <AvatarFallback className="bg-transparent">
              {fallback ?? <CircleUserRoundIcon className="size-4 opacity-60" />}
            </AvatarFallback>
          </Avatar>
          {!previewUrl ? (
            <span className="absolute right-0 bottom-0 flex size-6 items-center justify-center rounded-full border border-background bg-primary text-primary-foreground shadow-sm">
              <UploadIcon className="size-3.5" />
            </span>
          ) : null}
        </button>

        {selectedFile ? (
          <Button
            aria-label="Remove selected image"
            className="absolute -top-1 -right-1 size-6 rounded-full border-2 border-background shadow-none focus-visible:border-background"
            disabled={disabled}
            onClick={() => removeFile(selectedFile.id)}
            size="icon"
          >
            <XIcon className="size-3.5" />
          </Button>
        ) : null}

        <input
          {...getInputProps()}
          aria-label="Upload image file"
          className="sr-only"
          disabled={disabled}
          tabIndex={-1}
        />
      </div>

      {fileName ? <p className="text-xs text-muted-foreground">{fileName}</p> : null}
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      <FieldError>{errors[0]}</FieldError>
    </div>
  );
}
