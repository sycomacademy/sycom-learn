"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@sycom/ui/components/avatar";
import { Button } from "@sycom/ui/components/button";
import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from "@sycom/ui/components/cropper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@sycom/ui/components/dialog";
import { Slider } from "@sycom/ui/components/slider";
import { toastManager } from "@sycom/ui/components/toast";
import { useFileUpload } from "@sycom/ui/hooks/use-file-upload";
import { buildImageUrl } from "@sycom/ui/image/cdn";
import { getInitials } from "@sycom/ui/lib/string";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, CameraIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useTRPC, useTRPCClient } from "@/lib/trpc/client";

type Area = { x: number; y: number; width: number; height: number };

const AVATAR_OUTPUT_PX = 512;

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.crossOrigin = "anonymous";
    image.src = url;
  });
}

async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area,
  outputPx: number,
): Promise<Blob | null> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  canvas.width = outputPx;
  canvas.height = outputPx;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputPx,
    outputPx,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
  });
}

interface AvatarUploaderProps {
  user: {
    id: string;
    name: string;
    image?: string | null;
  };
}

export function AvatarUploader({ user }: AvatarUploaderProps) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  const [
    { files, isDragging },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({ accept: "image/*" });

  const previewUrl = files[0]?.preview ?? null;
  const fileId = files[0]?.id;

  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const previousFileIdRef = useRef<string | undefined | null>(null);

  const handleCropChange = useCallback((pixels: Area | null) => {
    setCroppedAreaPixels(pixels);
  }, []);

  useEffect(() => {
    if (fileId && fileId !== previousFileIdRef.current) {
      setIsDialogOpen(true);
      setCroppedAreaPixels(null);
      setZoom(1);
    }
    previousFileIdRef.current = fileId;
  }, [fileId]);

  const handleDialogChange = (next: boolean) => {
    if (isUploading) return;
    setIsDialogOpen(next);
    if (!next && fileId) {
      removeFile(fileId);
      setCroppedAreaPixels(null);
    }
  };

  const handleSave = async () => {
    if (!previewUrl || !fileId || !croppedAreaPixels) return;
    setIsUploading(true);
    try {
      const blob = await getCroppedBlob(previewUrl, croppedAreaPixels, AVATAR_OUTPUT_PX);
      if (!blob) throw new Error("Couldn't render the cropped image.");

      const sig = await trpcClient.avatar.createUploadSignature.mutate();

      const formData = new FormData();
      formData.append("file", blob, `${fileId}.jpg`);
      formData.append("api_key", sig.apiKey);
      formData.append("timestamp", String(sig.timestamp));
      formData.append("signature", sig.signature);
      formData.append("public_id", sig.publicId);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Cloudinary upload failed (${res.status}): ${text}`);
      }
      const json = (await res.json()) as {
        public_id: string;
        format: string;
        width: number;
        height: number;
        bytes: number;
        original_filename?: string;
      };

      await trpcClient.avatar.commit.mutate({
        publicId: json.public_id,
        format: json.format,
        width: json.width,
        height: json.height,
        bytes: json.bytes,
        name: json.original_filename,
      });

      await queryClient.invalidateQueries({ queryKey: trpc.profile.get.queryKey() });

      toastManager.add({ title: "Avatar updated", type: "success" });
      removeFile(fileId);
      setIsDialogOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Couldn't upload avatar. Please try again.";
      toastManager.add({ title: "Upload failed", description: message, type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  const initials = getInitials(user.name);
  const avatarSrc = user.image ? buildImageUrl(user.image) : undefined;

  return (
    <div
      className="relative inline-flex"
      data-dragging={isDragging || undefined}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Avatar className="size-14 rounded-xl text-sm">
        {avatarSrc ? <AvatarImage alt={user.name} src={avatarSrc} /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <button
        aria-label="Change profile photo"
        className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
        onClick={openFileDialog}
        type="button"
      >
        <CameraIcon className="size-3" />
      </button>
      <input
        {...getInputProps()}
        aria-label="Upload avatar image"
        className="sr-only"
        tabIndex={-1}
      />

      <Dialog onOpenChange={handleDialogChange} open={isDialogOpen}>
        <DialogContent className="gap-0 p-0 sm:max-w-140 *:[button]:hidden">
          <DialogDescription className="sr-only">Crop avatar</DialogDescription>
          <DialogHeader className="contents space-y-0 text-left">
            <DialogTitle className="flex items-center justify-between border-b p-4 text-base">
              <div className="flex items-center gap-2">
                <Button
                  aria-label="Cancel"
                  className="-my-1 opacity-60"
                  disabled={isUploading}
                  onClick={() => handleDialogChange(false)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <ArrowLeftIcon aria-hidden="true" />
                </Button>
                <span>Crop avatar</span>
              </div>
              <Button
                className="-my-1"
                disabled={!previewUrl || !croppedAreaPixels}
                loading={isUploading}
                onClick={handleSave}
                type="button"
              >
                Save
              </Button>
            </DialogTitle>
          </DialogHeader>
          {previewUrl ? (
            <Cropper
              className="h-96 sm:h-120"
              image={previewUrl}
              onCropChange={handleCropChange}
              onZoomChange={setZoom}
              zoom={zoom}
            >
              <CropperDescription />
              <CropperImage />
              <CropperCropArea />
            </Cropper>
          ) : null}
          <DialogFooter className="border-t px-4 py-6">
            <div className="mx-auto flex w-full max-w-80 items-center gap-4">
              <ZoomOutIcon aria-hidden="true" className="shrink-0 opacity-60" size={16} />
              <Slider
                aria-label="Zoom"
                defaultValue={[1]}
                max={3}
                min={1}
                onValueChange={(value) => {
                  const next = value[0];
                  if (typeof next === "number") setZoom(next);
                }}
                step={0.1}
                value={[zoom]}
              />
              <ZoomInIcon aria-hidden="true" className="shrink-0 opacity-60" size={16} />
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
