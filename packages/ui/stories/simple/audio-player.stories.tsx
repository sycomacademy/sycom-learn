import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  AudioPlayer,
  AudioPlayerContent,
  AudioPlayerControlBar,
  AudioPlayerMuteButton,
  AudioPlayerPlayButton,
  AudioPlayerSeekBackwardButton,
  AudioPlayerSeekForwardButton,
  AudioPlayerTimeDisplay,
  AudioPlayerTimeRange,
  AudioPlayerVolumeRange,
} from "@sycom/ui/components/kibo-ui/audio-player";

/** CC0 sample from MDN (reliable in Storybook). */
const SAMPLE_AUDIO = "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3";

function AudioChrome({ src = SAMPLE_AUDIO, className }: { src?: string; className?: string }) {
  return (
    <AudioPlayer className={className}>
      <AudioPlayerContent src={src} preload="metadata" />
      <AudioPlayerControlBar className="flex flex-wrap items-center gap-0 border-t bg-background/95">
        <AudioPlayerPlayButton />
        <AudioPlayerSeekBackwardButton />
        <AudioPlayerSeekForwardButton />
        <AudioPlayerTimeRange className="min-w-[120px] flex-1" />
        <AudioPlayerTimeDisplay showDuration />
        <AudioPlayerMuteButton />
        <AudioPlayerVolumeRange />
      </AudioPlayerControlBar>
    </AudioPlayer>
  );
}

const meta = {
  title: "Simple/Audio player (media-chrome)",
  component: AudioPlayer,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Composable audio shell: `MediaController` with `audio` + themed CSS variables + media-chrome controls. Mirrors kibo video API; used inside the Tiptap audio node.",
      },
    },
  },
} satisfies Meta<typeof AudioPlayer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <div className="w-full max-w-xl overflow-hidden rounded-lg border shadow-sm">
      <AudioChrome />
    </div>
  ),
};

export const Narrow: Story = {
  render: () => (
    <div className="w-full max-w-xs overflow-hidden rounded-lg border shadow-sm">
      <AudioChrome />
    </div>
  ),
};
