import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../src/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../src/components/card";
import { Input } from "../../src/components/input";
import { Label } from "../../src/components/label";

const meta = {
  title: "Simple/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["default", "sm"],
    },
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Card {...args} className="w-sm">
      <CardHeader>
        <CardTitle>Card title</CardTitle>
        <CardDescription>Short description for the card contents.</CardDescription>
      </CardHeader>
      <CardContent>Body content goes here.</CardContent>
      <CardFooter>
        <Button size="sm">Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const LoginCard: Story = {
  render: () => (
    <Card className="w-sm">
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>Enter your email below to login.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="card-email">Email</Label>
            <Input id="card-email" type="email" placeholder="m@example.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="card-password">Password</Label>
            <Input id="card-password" type="password" />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button className="w-full">Login</Button>
        <Button className="w-full" variant="outline">
          Login with Google
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex w-2xl flex-wrap items-start gap-4">
      <Card className="min-w-48">
        <CardContent>Content only</CardContent>
      </Card>
      <Card className="min-w-48">
        <CardHeader>
          <CardTitle>Header only</CardTitle>
          <CardDescription>Description.</CardDescription>
        </CardHeader>
      </Card>
      <Card className="min-w-48">
        <CardHeader>
          <CardTitle>Header + content</CardTitle>
        </CardHeader>
        <CardContent>Some content.</CardContent>
      </Card>
      <Card className="min-w-48">
        <CardHeader>
          <CardTitle>Full card</CardTitle>
          <CardDescription>Header, content, footer.</CardDescription>
        </CardHeader>
        <CardContent>Some content.</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    </div>
  ),
};
