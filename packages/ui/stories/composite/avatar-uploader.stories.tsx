import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";

import { AvatarUploader } from "../../src/components/avatar-uploader";

const existingAvatar =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="avatar-gradient" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#7c3aed" />
          <stop offset="100%" stop-color="#14b8a6" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" fill="url(#avatar-gradient)" rx="40" />
      <circle cx="80" cy="62" r="28" fill="#ffffff" fill-opacity="0.92" />
      <path d="M34 132c8-25 28-38 46-38s38 13 46 38" fill="#ffffff" fill-opacity="0.92" />
    </svg>
  `);

function createAvatarFile(name = "avatar.png") {
  return new File(
    [
      `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
          <defs>
            <linearGradient id="upload-gradient" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stop-color="#0f172a" />
              <stop offset="100%" stop-color="#38bdf8" />
            </linearGradient>
          </defs>
          <rect width="256" height="256" rx="64" fill="url(#upload-gradient)" />
          <circle cx="128" cy="104" r="44" fill="#fff" fill-opacity="0.94" />
          <path d="M58 212c15-40 41-60 70-60s55 20 70 60" fill="#fff" fill-opacity="0.94" />
        </svg>
      `,
    ],
    name,
    { type: "image/svg+xml" },
  );
}

async function uploadAvatar(canvasElement: HTMLElement, file = createAvatarFile()) {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);

  const input = canvasElement.querySelector(
    'input[aria-label="Upload avatar image"]',
  ) as HTMLInputElement | null;

  if (!input) return;

  Object.defineProperty(input, "files", {
    configurable: true,
    value: dataTransfer.files,
  });

  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function AvatarUploaderDemo({
  initialImage,
  name,
}: {
  initialImage?: string | null;
  name: string;
}) {
  const [currentImage, setCurrentImage] = useState<string | null>(initialImage ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [lastSavedFileName, setLastSavedFileName] = useState<string | null>(null);
  const previousObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setCurrentImage(initialImage ?? null);
  }, [initialImage]);

  useEffect(() => {
    return () => {
      if (previousObjectUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(previousObjectUrlRef.current);
      }
    };
  }, []);

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 p-4">
      <AvatarUploader
        currentImagePublicId={currentImage}
        isUploading={isUploading}
        name={name}
        onCropComplete={async (blob, fileName) => {
          setIsUploading(true);
          await new Promise((resolve) => window.setTimeout(resolve, 700));
          const nextObjectUrl = URL.createObjectURL(blob);
          if (previousObjectUrlRef.current?.startsWith("blob:")) {
            URL.revokeObjectURL(previousObjectUrlRef.current);
          }
          previousObjectUrlRef.current = nextObjectUrl;
          setCurrentImage(nextObjectUrl);
          setLastSavedFileName(fileName);
          setIsUploading(false);
        }}
      />
      <div className="space-y-1 text-sm">
        <p className="font-medium text-foreground">{name}</p>
        <p className="text-muted-foreground">
          {lastSavedFileName
            ? `Latest cropped file: ${lastSavedFileName}`
            : "Select an image to open the crop flow."}
        </p>
      </div>
    </div>
  );
}

function AutoOpenAvatarStory({ file, children }: { file?: File; children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasSeededRef = useRef(false);

  useEffect(() => {
    if (hasSeededRef.current || !file || !containerRef.current) return;

    void uploadAvatar(containerRef.current, file);
    hasSeededRef.current = true;
  }, [file]);

  return <div ref={containerRef}>{children}</div>;
}

const meta = {
  title: "Composite/AvatarUploader",
  component: AvatarUploader,
  tags: ["autodocs"],
  args: {
    name: "Jordan Park",
    onCropComplete: async () => {},
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof AvatarUploader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InitialsFallback: Story = {
  render: () => <AvatarUploaderDemo name="Jordan Park" />,
};

export const ExistingAvatar: Story = {
  render: () => <AvatarUploaderDemo initialImage={existingAvatar} name="Jordan Park" />,
};

export const CropNewAvatar: Story = {
  render: () => (
    <AutoOpenAvatarStory file={createAvatarFile()}>
      <AvatarUploaderDemo name="Jordan Park" />
    </AutoOpenAvatarStory>
  ),
};

export const ReplaceExistingAvatar: Story = {
  render: () => (
    <AutoOpenAvatarStory file={createAvatarFile("replacement-avatar.svg")}>
      <AvatarUploaderDemo initialImage={existingAvatar} name="Jordan Park" />
    </AutoOpenAvatarStory>
  ),
};

// export const SavingState: Story = {
//   render: () => (
//     <AutoOpenAvatarStory file={createAvatarFile("pending-avatar.svg")}>
//       <div className="w-full max-w-sm p-4">
//         <AvatarUploader
//           currentImagePublicId={existingAvatar}
//           isUploading
//           name="Jordan Park"
//           onCropComplete={async () => {}}
//         />
//       </div>
//     </AutoOpenAvatarStory>
//   ),
// };
