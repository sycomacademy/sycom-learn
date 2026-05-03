import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerSeekBackwardButton,
  VideoPlayerSeekForwardButton,
  VideoPlayerTimeDisplay,
  VideoPlayerTimeRange,
  VideoPlayerVolumeRange,
} from "@sycom/ui/components/kibo-ui/video-player";

/** CC0 sample from MDN (reliable in Storybook). */
const SAMPLE_VIDEO = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

function VideoChrome({
  src = SAMPLE_VIDEO,
  poster,
  className,
}: {
  src?: string;
  poster?: string;
  className?: string;
}) {
  return (
    <VideoPlayer className={className}>
      <VideoPlayerContent src={src} poster={poster} playsInline preload="metadata" />
      <VideoPlayerControlBar className="flex flex-wrap items-center gap-0 border-t bg-background/95">
        <VideoPlayerPlayButton />
        <VideoPlayerSeekBackwardButton />
        <VideoPlayerSeekForwardButton />
        <VideoPlayerTimeRange className="min-w-[120px] flex-1" />
        <VideoPlayerTimeDisplay showDuration />
        <VideoPlayerMuteButton />
        <VideoPlayerVolumeRange />
      </VideoPlayerControlBar>
    </VideoPlayer>
  );
}

const meta = {
  title: "Simple/Video player (media-chrome)",
  component: VideoPlayer,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Composable video shell from kibo-ui: `MediaController` + themed CSS variables + media-chrome controls. Used inside the Tiptap video node.",
      },
    },
  },
} satisfies Meta<typeof VideoPlayer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <div className="w-full max-w-2xl overflow-hidden rounded-lg border shadow-sm">
      <VideoChrome />
    </div>
  ),
};

export const WithPoster: Story = {
  render: () => (
    <div className="w-full max-w-2xl overflow-hidden rounded-lg border shadow-sm">
      <VideoChrome poster="https://picsum.photos/seed/tiptap-video/640/360" />
    </div>
  ),
};

export const Narrow: Story = {
  render: () => (
    <div className="w-full max-w-xs overflow-hidden rounded-lg border shadow-sm">
      <VideoChrome />
    </div>
  ),
};
