import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { useEffect, useRef } from "react";

import { FileUploader } from "../../src/components/file-uploader";

function createFile(name: string, type: string, size: number) {
  return new File([new Uint8Array(size)], name, { type });
}

function seedFiles(input: HTMLInputElement, files: File[]) {
  const dataTransfer = new DataTransfer();

  for (const file of files) {
    dataTransfer.items.add(file);
  }

  Object.defineProperty(input, "files", {
    configurable: true,
    value: dataTransfer.files,
  });

  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function AutoUploadFileUploader({
  filesToUpload,
  ...props
}: ComponentProps<typeof FileUploader> & { filesToUpload?: File[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasSeededRef = useRef(false);

  useEffect(() => {
    if (hasSeededRef.current || !filesToUpload?.length) return;

    const input = containerRef.current?.querySelector(
      'input[aria-label="Upload files"]',
    ) as HTMLInputElement | null;

    if (!input) return;

    seedFiles(input, filesToUpload);
    hasSeededRef.current = true;
  }, [filesToUpload]);

  return (
    <div ref={containerRef}>
      <FileUploader {...props} />
    </div>
  );
}

type FileUploaderStoryArgs = ComponentProps<typeof FileUploader>;

const meta = {
  title: "Composite/FileUploader",
  component: FileUploader,
  tags: ["autodocs"],
  args: {
    accept: "image/*",
    maxFileCount: 1,
    maxSize: 1024 * 1024 * 5,
    multiple: false,
    disabled: false,
  },
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-xl p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FileUploader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AttachmentsWithProgress: Story = {
  args: {
    accept: "image/*,.pdf",
    maxFileCount: 3,
    multiple: true,
    progresses: {
      "headshot.png": 100,
      "brief.pdf": 68,
    },
  } satisfies FileUploaderStoryArgs,
  render: (args) => (
    <AutoUploadFileUploader
      {...args}
      filesToUpload={[
        createFile("headshot.png", "image/png", 420_000),
        createFile("brief.pdf", "application/pdf", 680_000),
      ]}
    />
  ),
};

export const ValidationErrors: Story = {
  args: {
    accept: "image/*",
    maxFileCount: 2,
    maxSize: 1024,
    multiple: true,
  } satisfies FileUploaderStoryArgs,
  render: (args) => (
    <AutoUploadFileUploader
      {...args}
      filesToUpload={[
        createFile("contract.pdf", "application/pdf", 800),
        createFile("oversized.png", "image/png", 2_048),
      ]}
    />
  ),
};

export const MaxFilesReached: Story = {
  args: {
    accept: "image/*",
    maxFileCount: 2,
    multiple: true,
  } satisfies FileUploaderStoryArgs,
  render: (args) => (
    <AutoUploadFileUploader
      {...args}
      filesToUpload={[
        createFile("cover.png", "image/png", 340_000),
        createFile("thumbnail.png", "image/png", 210_000),
      ]}
    />
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    accept: "image/*,.pdf",
    maxFileCount: 5,
    multiple: true,
  } satisfies FileUploaderStoryArgs,
};
