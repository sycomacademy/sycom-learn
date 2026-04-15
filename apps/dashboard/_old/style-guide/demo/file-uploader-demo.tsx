"use client";

import { useState } from "react";
import { FileUploader } from "@/components/elements/file-uploader";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import type { StorageFolder } from "@/packages/db/schema/storage";
import { uploadFile } from "@/packages/storage/upload";
import { getSignedParams, persistAsset } from "./file-uploader-actions";

const FOLDERS: {
  folder: StorageFolder;
  label: string;
  accept: Record<string, string[]>;
  maxFileCount: number;
  maxSize: number;
}[] = [
  {
    folder: "demo",
    label: "Single Image only",
    accept: { "image/*": [] },
    maxFileCount: 1,
    maxSize: 1024 * 1024 * 4,
  },
  {
    folder: "demo",
    label: "Two Images only",
    accept: { "image/*": [] },
    maxFileCount: 2,
    maxSize: 1024 * 1024 * 8,
  },
  {
    folder: "demo",
    label: "Multiple Files (Images, Videos, PDFs)",
    accept: { "image/*": [], "video/*": [], "application/pdf": [] },
    maxFileCount: 3,
    maxSize: 1024 * 1024 * 512,
  },
];

export function FileUploaderDemo() {
  return (
    <div className="grid w-full gap-8">
      {FOLDERS.map((props) => (
        <FolderUploader key={props.label} {...props} />
      ))}
    </div>
  );
}

function FolderUploader({
  folder,
  label,
  accept,
  maxSize,
  maxFileCount,
}: {
  folder: StorageFolder;
  label: string;
  accept: Record<string, string[]>;
  maxSize: number;
  maxFileCount: number;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [progresses, setProgresses] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);

  async function handleUpload() {
    setUploading(true);

    const promise = (async () => {
      for (const file of files) {
        const signedParams = await getSignedParams(folder);

        const result = await uploadFile({
          file,
          signedParams,
          onProgress: (pct) =>
            setProgresses((prev) => ({ ...prev, [file.name]: pct })),
        });

        await persistAsset(result, folder);
        setProgresses((prev) => ({ ...prev, [file.name]: 100 }));
      }
      setFiles([]);
      setProgresses({});
    })();

    toastManager.promise(promise, {
      loading: `Uploading to ${label}...`,
      success: "Upload complete",
      error: (error) =>
        error instanceof Error
          ? `Upload failed: ${error.message}`
          : "Upload failed",
    });

    try {
      await promise;
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <p className="font-medium text-sm">{label}</p>
      <FileUploader
        accept={accept}
        maxFileCount={maxFileCount}
        maxSize={maxSize}
        multiple
        onValueChange={setFiles}
        progresses={progresses}
        value={files}
      />
      <div>
        <Button
          disabled={uploading || files.length === 0}
          onClick={handleUpload}
        >
          Upload
        </Button>
      </div>
    </div>
  );
}
