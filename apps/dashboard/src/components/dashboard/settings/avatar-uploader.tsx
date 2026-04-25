"use client";

import { uploadFile } from "@sycom/storage/client";
import { AvatarUploader as AvatarUploaderUI } from "@sycom/ui/components/avatar-uploader";
import { toastManager } from "@sycom/ui/components/toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useTRPC, useTRPCClient } from "@/lib/trpc/client";

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
  const [isUploading, setIsUploading] = useState(false);

  const handleCropComplete = async (blob: Blob, fileName: string) => {
    setIsUploading(true);
    try {
      const signedParams = await trpcClient.storage.signUpload.mutate({
        folder: "user_avatars",
        entityType: "user",
        entityId: user.id,
      });

      const file = new File([blob], fileName, { type: blob.type });
      const result = await uploadFile({ file, signedParams });

      await trpcClient.storage.saveAsset.mutate({
        publicId: result.publicId,
        secureUrl: result.secureUrl,
        folder: "user_avatars",
        entityType: "user",
        entityId: user.id,
        resourceType: result.resourceType,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        name: fileName,
      });

      await trpcClient.profile.updateAvatar.mutate({ publicId: result.publicId });
      await queryClient.invalidateQueries({ queryKey: trpc.profile.get.queryKey() });

      toastManager.add({ title: "Avatar updated", type: "success" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Couldn't upload avatar. Please try again.";
      toastManager.add({ title: "Upload failed", description: message, type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AvatarUploaderUI
      currentImagePublicId={user.image}
      isUploading={isUploading}
      name={user.name}
      onCropComplete={handleCropComplete}
    />
  );
}
