"use client";

import {
  type ChangeEvent,
  type DragEvent,
  type InputHTMLAttributes,
  type Ref,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type FileMetadata = {
  name: string;
  size: number;
  type: string;
  url: string;
  id: string;
};

export type FileWithPreview = {
  file: File | FileMetadata;
  id: string;
  preview?: string;
};

export type FileUploadOptions = {
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  multiple?: boolean;
  initialFiles?: FileMetadata[];
  onFilesChange?: (files: FileWithPreview[]) => void;
  onFilesAdded?: (addedFiles: FileWithPreview[]) => void;
};

export type FileUploadState = {
  files: FileWithPreview[];
  isDragging: boolean;
  errors: string[];
};

export type FileUploadActions = {
  addFiles: (files: FileList | File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  clearErrors: () => void;
  handleDragEnter: (e: DragEvent<HTMLElement>) => void;
  handleDragLeave: (e: DragEvent<HTMLElement>) => void;
  handleDragOver: (e: DragEvent<HTMLElement>) => void;
  handleDrop: (e: DragEvent<HTMLElement>) => void;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  openFileDialog: () => void;
  getInputProps: (
    props?: InputHTMLAttributes<HTMLInputElement>,
  ) => InputHTMLAttributes<HTMLInputElement> & {
    ref: Ref<HTMLInputElement>;
  };
};

function createPreview(file: File | FileMetadata): string | undefined {
  if (file instanceof File) {
    return URL.createObjectURL(file);
  }

  return file.url;
}

function revokePreview(file: FileWithPreview) {
  if (file.preview && file.file instanceof File && file.file.type.startsWith("image/")) {
    URL.revokeObjectURL(file.preview);
  }
}

function validateFile(
  file: File | FileMetadata,
  { accept, maxSize }: Pick<FileUploadOptions, "accept" | "maxSize">,
): string | null {
  const resolvedMaxSize = maxSize ?? Number.POSITIVE_INFINITY;
  const resolvedAccept = accept ?? "*";

  if (file.size > resolvedMaxSize) {
    return `File "${file.name}" exceeds the maximum size of ${formatBytes(resolvedMaxSize)}.`;
  }

  if (resolvedAccept === "*") {
    return null;
  }

  const acceptedTypes = resolvedAccept.split(",").map((type) => type.trim());
  const fileType = file.type || "";
  const fileExtension = `.${file.name.split(".").pop() ?? ""}`;

  const isAccepted = acceptedTypes.some((type) => {
    if (type.startsWith(".")) {
      return fileExtension.toLowerCase() === type.toLowerCase();
    }

    if (type.endsWith("/*")) {
      const baseType = type.split("/")[0];
      return fileType.startsWith(`${baseType}/`);
    }

    return fileType === type;
  });

  return isAccepted ? null : `File "${file.name}" is not an accepted file type.`;
}

export function useFileUpload(
  options: FileUploadOptions = {},
): [FileUploadState, FileUploadActions] {
  const {
    maxFiles = Number.POSITIVE_INFINITY,
    maxSize = Number.POSITIVE_INFINITY,
    accept = "*",
    multiple = false,
    initialFiles = [],
    onFilesChange,
    onFilesAdded,
  } = options;

  const [state, setState] = useState<FileUploadState>({
    errors: [],
    files: initialFiles.map((file) => ({
      file,
      id: file.id,
      preview: file.url,
    })),
    isDragging: false,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      for (const file of state.files) {
        revokePreview(file);
      }
    };
  }, [state.files]);

  const clearFiles = useCallback(() => {
    setState((prev) => {
      for (const file of prev.files) {
        revokePreview(file);
      }

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      const nextFiles: FileWithPreview[] = [];
      onFilesChange?.(nextFiles);

      return {
        ...prev,
        errors: [],
        files: nextFiles,
      };
    });
  }, [onFilesChange]);

  const addFiles = useCallback(
    (incomingFiles: FileList | File[]) => {
      if (incomingFiles.length === 0) {
        return;
      }

      const nextIncomingFiles = Array.from(incomingFiles);

      setState((prev) => {
        const errors: string[] = [];
        const existingFiles = multiple ? prev.files : [];

        if (
          multiple &&
          maxFiles !== Number.POSITIVE_INFINITY &&
          existingFiles.length + nextIncomingFiles.length > maxFiles
        ) {
          return {
            ...prev,
            errors: [`You can only upload a maximum of ${maxFiles} files.`],
          };
        }

        const validFiles: FileWithPreview[] = [];

        for (const file of nextIncomingFiles) {
          if (multiple) {
            const isDuplicate = existingFiles.some(
              (existingFile) =>
                existingFile.file.name === file.name && existingFile.file.size === file.size,
            );

            if (isDuplicate) {
              continue;
            }
          }

          const error = validateFile(file, { accept, maxSize });
          if (error) {
            errors.push(error);
            continue;
          }

          validFiles.push({
            file,
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            preview: createPreview(file),
          });
        }

        if (!multiple) {
          for (const file of prev.files) {
            revokePreview(file);
          }
        }

        const nextFiles = multiple ? [...existingFiles, ...validFiles] : validFiles;

        if (inputRef.current) {
          inputRef.current.value = "";
        }

        if (validFiles.length > 0) {
          onFilesAdded?.(validFiles);
        }
        onFilesChange?.(nextFiles);

        return {
          ...prev,
          errors,
          files: nextFiles,
        };
      });
    },
    [accept, maxFiles, maxSize, multiple, onFilesAdded, onFilesChange],
  );

  const removeFile = useCallback(
    (id: string) => {
      setState((prev) => {
        const fileToRemove = prev.files.find((file) => file.id === id);
        if (fileToRemove) {
          revokePreview(fileToRemove);
        }

        const nextFiles = prev.files.filter((file) => file.id !== id);
        onFilesChange?.(nextFiles);

        return {
          ...prev,
          errors: [],
          files: nextFiles,
        };
      });
    },
    [onFilesChange],
  );

  const clearErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      errors: [],
    }));
  }, []);

  const handleDragEnter = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setState((prev) => ({ ...prev, isDragging: true }));
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.currentTarget.contains(e.relatedTarget as Node | null)) {
      return;
    }

    setState((prev) => ({ ...prev, isDragging: false }));
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setState((prev) => ({ ...prev, isDragging: false }));

      if (inputRef.current?.disabled) {
        return;
      }

      if (e.dataTransfer.files.length > 0) {
        const droppedFile = e.dataTransfer.files.item(0);

        if (multiple) {
          addFiles(e.dataTransfer.files);
        } else if (droppedFile) {
          addFiles([droppedFile]);
        }
      }
    },
    [addFiles, multiple],
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
    },
    [addFiles],
  );

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const getInputProps = useCallback(
    (props: InputHTMLAttributes<HTMLInputElement> = {}) => ({
      ...props,
      accept: props.accept ?? accept,
      multiple: props.multiple ?? multiple,
      onChange: handleFileChange,
      ref: inputRef,
      type: "file" as const,
    }),
    [accept, handleFileChange, multiple],
  );

  return [
    state,
    {
      addFiles,
      removeFile,
      clearFiles,
      clearErrors,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      handleFileChange,
      openFileDialog,
      getInputProps,
    },
  ];
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}
