import type { Meta, StoryObj } from "@storybook/react-vite";

import { Card, CardContent, CardHeader } from "../../src/components/card";
import { Skeleton } from "../../src/components/skeleton";

const meta = {
  title: "Simple/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { className: "h-4 w-48" },
};

export const AvatarRow: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="grid gap-2">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[100px]" />
      </div>
    </div>
  ),
};

export const CardList: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card className="w-64" key={index}>
          <CardHeader>
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="aspect-square w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};
