import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider, SliderValue } from "@sycom/ui/components/slider";

const meta = {
  title: "Simple/Slider",
  component: Slider,
  tags: ["autodocs"],
  args: {
    defaultValue: 35,
    min: 0,
    max: 100,
    disabled: false,
  },
} satisfies Meta<typeof Slider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Slider className="w-sm" {...args}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">Volume</span>
        <SliderValue />
      </div>
    </Slider>
  ),
};

export const Disabled: Story = {
  args: { defaultValue: 50, disabled: true },
  render: (args) => (
    <div className="w-sm">
      <Slider {...args} />
    </div>
  ),
};

export const Range: Story = {
  args: { defaultValue: [20, 80], min: 0, max: 100 },
  render: (args) => (
    <Slider className="w-sm" {...args}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">Range</span>
        <SliderValue>{(_, values) => values.join(" – ")}</SliderValue>
      </div>
    </Slider>
  ),
};

export const WithSteps: Story = {
  args: { defaultValue: 2, max: 5, min: 0, step: 1 },
  render: (args) => (
    <div className="w-sm">
      <Slider {...args} />
    </div>
  ),
};
